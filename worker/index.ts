import { drizzle } from 'drizzle-orm/d1'
import { and, asc, count, desc, eq, gte, inArray, isNotNull, isNull, like, lt, or, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { posts, visitors, debateRuns, reactions, bookmarks, usageEvents } from './db/schema'
import {
  BOTS, DEBATE_LIMITS, FEED_TABS, AUTHOR_FILTERS, PERSONAS, PERSONA_IDS, PostInput, guestIdentity,
  type AuthorView, type DebateView, type LiveEvent, type MediaSpec, type PersonaId, type PostView, type Stats, type ThreadView, type TrendingTopic,
} from '../shared/contract'
import { aiMode, generateReplies, personaName, type HistoryItem } from './ai'

export { ThreadRoom } from './thread-room'

// Secrets (wrangler secret put / .dev.vars); all optional — without them the app runs in demo mode.
declare global {
  interface Env {
    OPENROUTER_API_KEY?: string
    CLOUDFLARE_ACCOUNT_ID?: string
    AI_GATEWAY_ID?: string
    AI_GATEWAY_TOKEN?: string
  }
}

const schema = { posts, visitors, debateRuns, reactions, bookmarks, usageEvents }
type DB = ReturnType<typeof drizzle<typeof schema>>
type Post = typeof posts.$inferSelect
type Run = typeof debateRuns.$inferSelect
type Visitor = typeof visitors.$inferSelect

const LIMITS = {
  postsPerWindow: 8,
  postWindowMs: 10 * 60_000,
  debatesPerVisitorPerDay: 20,
  debatesPerDay: 500, // global spend guard for OpenRouter credits
  // per-IP caps stop one client from minting guest sessions to dodge the per-guest limits
  postsPerIpPerWindow: 30,
  debatesPerIpPerDay: 60,
  sessionsPerIpPerHour: 30,
  retriesPerRun: 2,
  threadPosts: 200,
  pageSize: 15,
  previewReplies: 4,
}
const DAY = 86_400_000
const COOKIE = 'dn_sid'

class HttpError extends Error {
  constructor(readonly status: number, message: string) { super(message) }
}

interface Ctx {
  req: Request
  url: URL
  env: Env
  exec: ExecutionContext
  db: DB
  ip: string
  visitor: Visitor | null
  setCookie?: string
}

type UsageKind = 'post' | 'ai' | 'session'

/** Counts usage events (append-only, survives post deletion) for this visitor, this IP and globally. */
async function usage(ctx: Ctx, kind: UsageKind, since: number) {
  const { db } = ctx
  const recent = and(eq(usageEvents.kind, kind), gte(usageEvents.createdAt, since))
  const [mine, ip, all] = await Promise.all([
    ctx.visitor ? db.select({ n: count() }).from(usageEvents).where(and(recent, eq(usageEvents.visitorId, ctx.visitor.id))).get() : undefined,
    db.select({ n: count() }).from(usageEvents).where(and(recent, eq(usageEvents.ip, ctx.ip))).get(),
    db.select({ n: count() }).from(usageEvents).where(recent).get(),
  ])
  return { mine: mine?.n ?? 0, ip: ip?.n ?? 0, all: all?.n ?? 0 }
}

const usageRow = (ctx: Ctx, kind: UsageKind, extra: { rootId?: string; runId?: string } = {}) =>
  ({ kind, visitorId: ctx.visitor?.id ?? '', ip: ctx.ip, rootId: extra.rootId ?? null, runId: extra.runId ?? null, createdAt: Date.now() })

// ---------- sessions ----------
async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function readCookie(req: Request, name: string) {
  const header = req.headers.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return v.join('=')
  }
  return null
}

async function loadVisitor(db: DB, req: Request) {
  const token = readCookie(req, COOKIE)
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null
  return (await db.select().from(visitors).where(eq(visitors.tokenHash, await sha256(token))).get()) ?? null
}

/** Returns the current guest, creating an anonymous session (opaque token in an HttpOnly cookie) if needed. */
async function requireVisitor(ctx: Ctx): Promise<Visitor> {
  if (ctx.visitor) return ctx.visitor
  if ((await usage(ctx, 'session', Date.now() - 3_600_000)).ip >= LIMITS.sessionsPerIpPerHour) {
    throw new HttpError(429, 'Too many new sessions from this network. Try again later.')
  }
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const token = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const now = Date.now()
  const visitor: Visitor = { id: crypto.randomUUID(), tokenHash: await sha256(token), kind: 'guest', createdAt: now, lastSeenAt: now }
  await ctx.db.batch([ctx.db.insert(visitors).values(visitor), ctx.db.insert(usageEvents).values({ ...usageRow(ctx, 'session'), visitorId: visitor.id })])
  const secure = ctx.url.protocol === 'https:' ? '; Secure' : ''
  ctx.setCookie = `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`
  ctx.visitor = visitor
  return visitor
}

// ---------- view building ----------
function author(type: Post['authorType'], id: string): AuthorView {
  if (type === 'persona') {
    const p = PERSONAS[id as PersonaId]
    if (p) return { type, id, name: p.name, handle: p.handle, avatar: p.avatar, verified: false }
  }
  if (type === 'bot') {
    const b = BOTS[id]
    if (b) return { type, id, name: b.name, handle: b.handle, avatar: b.avatar, verified: b.verified }
  }
  return { type: 'human', id, ...guestIdentity(id), verified: false }
}

const runView = (r: Run, visitorId: string | undefined): DebateView => ({
  id: r.id, kind: r.kind, status: r.status, personaId: (r.personaId as PersonaId | null) ?? null, error: r.error, isOwn: r.visitorId === visitorId,
})

// D1 caps bound parameters per statement, so IN (...) lists are chunked.
async function inChunks<T>(ids: string[], fn: (chunk: string[]) => Promise<T[]>): Promise<T[]> {
  const out: T[] = []
  for (let i = 0; i < ids.length; i += 80) out.push(...(await fn(ids.slice(i, i + 80))))
  return out
}

async function toViews(ctx: Ctx, rows: Post[]): Promise<PostView[]> {
  if (!rows.length) return []
  const { db } = ctx
  const ids = rows.map((r) => r.id)
  const rootIds = rows.filter((r) => !r.parentId).map((r) => r.id)
  const vid = ctx.visitor?.id

  const [likes, direct, threadSizes, mine, saved, runs] = await Promise.all([
    inChunks(ids, (c) => db.select({ id: reactions.postId, n: count() }).from(reactions).where(inArray(reactions.postId, c)).groupBy(reactions.postId).all()),
    inChunks(ids, (c) => db.select({ id: posts.parentId, n: count() }).from(posts).where(inArray(posts.parentId, c)).groupBy(posts.parentId).all()),
    inChunks(rootIds, (c) => db.select({ id: posts.rootId, n: count() }).from(posts).where(inArray(posts.rootId, c)).groupBy(posts.rootId).all()),
    vid ? inChunks(ids, (c) => db.select({ id: reactions.postId }).from(reactions).where(and(eq(reactions.visitorId, vid), inArray(reactions.postId, c))).all()) : [],
    vid ? inChunks(ids, (c) => db.select({ id: bookmarks.postId }).from(bookmarks).where(and(eq(bookmarks.visitorId, vid), inArray(bookmarks.postId, c))).all()) : [],
    inChunks(rootIds, (c) => db.select().from(debateRuns).where(inArray(debateRuns.rootPostId, c)).orderBy(desc(debateRuns.createdAt)).all()),
  ])
  const likeMap = new Map(likes.map((l) => [l.id, l.n]))
  const directMap = new Map(direct.map((d) => [d.id, d.n]))
  const sizeMap = new Map(threadSizes.map((t) => [t.id, t.n]))
  const liked = new Set(mine.map((m) => m.id))
  const marked = new Set(saved.map((m) => m.id))
  const latestRun = new Map<string, Run>()
  for (const r of runs) if (!latestRun.has(r.rootPostId)) latestRun.set(r.rootPostId, r)

  return rows.map((r) => {
    const run = latestRun.get(r.id)
    return {
      id: r.id,
      rootId: r.rootId,
      parentId: r.parentId,
      author: author(r.authorType, r.authorId),
      content: r.content,
      media: (r.media as MediaSpec | null) ?? null,
      topic: r.topic,
      generator: r.generator,
      createdAt: r.createdAt,
      // roots show the whole conversation size, replies their direct children
      replyCount: r.parentId ? directMap.get(r.id) ?? 0 : Math.max(0, (sizeMap.get(r.id) ?? 1) - 1),
      likeCount: likeMap.get(r.id) ?? 0,
      liked: liked.has(r.id),
      bookmarked: marked.has(r.id),
      isOwn: r.authorType === 'human' && r.authorId === vid,
      debate: run ? runView(run, vid) : null,
    }
  })
}

/** Root posts plus their first few direct replies, as the feed shows them. */
async function withPreviews(ctx: Ctx, roots: Post[]): Promise<PostView[]> {
  const ids = roots.filter((r) => !r.parentId).map((r) => r.id)
  // shortcut: loads all direct replies of the page's roots; fine while threads are capped at LIMITS.threadPosts
  const replies = await inChunks(ids, (c) => ctx.db.select().from(posts).where(inArray(posts.parentId, c)).orderBy(asc(posts.createdAt)).all())
  const preview = new Map<string, Post[]>()
  for (const r of replies) {
    const list = preview.get(r.parentId!) ?? []
    if (list.length < LIMITS.previewReplies) preview.set(r.parentId!, [...list, r])
  }
  const all = await toViews(ctx, [...roots, ...[...preview.values()].flat()])
  const byId = new Map(all.map((v) => [v.id, v]))
  return roots.map((r) => ({ ...byId.get(r.id)!, replies: (preview.get(r.id) ?? []).map((p) => byId.get(p.id)!) }))
}

// ---------- pagination ----------
function cursorWhere(cursor: string | null): SQL | undefined {
  if (!cursor) return undefined
  const m = /^(\d{1,15})_([\w-]{1,40})$/.exec(cursor)
  if (!m) throw new HttpError(400, 'Invalid cursor')
  const ts = Number(m[1])
  return or(lt(posts.createdAt, ts), and(eq(posts.createdAt, ts), lt(posts.id, m[2])))
}

async function page(ctx: Ctx, where: (SQL | undefined)[], previews: boolean) {
  const rows = await ctx.db.select().from(posts)
    .where(and(...where, cursorWhere(ctx.url.searchParams.get('cursor'))))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(LIMITS.pageSize + 1).all()
  const more = rows.length > LIMITS.pageSize
  const slice = rows.slice(0, LIMITS.pageSize)
  const last = slice.at(-1)
  return {
    posts: previews ? await withPreviews(ctx, slice) : await toViews(ctx, slice),
    nextCursor: more && last ? `${last.createdAt}_${last.id}` : null,
  }
}

// ---------- live notifications ----------
async function notify(env: Env, rootId: string, event: LiveEvent) {
  try {
    await env.THREAD_ROOM.get(env.THREAD_ROOM.idFromName(rootId)).broadcast(JSON.stringify(event))
  } catch (e) {
    console.warn('notify failed', rootId, (e as Error).message)
  }
}

// ---------- debates ----------
/** Every generation attempt (initial, follow-up, retry) is logged as an 'ai' usage event and counted here. */
async function aiBudgetLeft(ctx: Ctx) {
  const n = await usage(ctx, 'ai', Date.now() - DAY)
  if (n.mine >= LIMITS.debatesPerVisitorPerDay || n.ip >= LIMITS.debatesPerIpPerDay) throw new HttpError(429, 'You have reached today\'s AI debate limit. Try again tomorrow.')
  if (n.all >= LIMITS.debatesPerDay) throw new HttpError(429, 'The simulation has reached its daily AI budget. Try again later.')
}

/**
 * Generates persona replies for a pending run and stores them in D1.
 * shortcut: runs inside waitUntil, which is not a durable queue — if the isolate dies mid-run the
 * run stays 'running'; such stale runs are shown as failed after 2 minutes and can be retried.
 */
async function runDebate(env: Env, runId: string) {
  const db = drizzle(env.DB, { schema })
  const claimed = await db.update(debateRuns).set({ status: 'running', updatedAt: Date.now() })
    .where(and(eq(debateRuns.id, runId), eq(debateRuns.status, 'pending'))).returning().get()
  if (!claimed) return
  await notify(env, claimed.rootPostId, { type: 'debate', debateId: runId, status: 'running' })
  try {
    const thread = await db.select().from(posts).where(eq(posts.rootId, claimed.rootPostId)).all()
    const byId = new Map(thread.map((p) => [p.id, p]))
    const history: HistoryItem[] = []
    for (let p = byId.get(claimed.targetPostId); p && history.length < DEBATE_LIMITS.historyPosts; p = p.parentId ? byId.get(p.parentId) : undefined) {
      const who = p.authorType === 'human' ? 'human' : p.authorType === 'persona' ? personaName(p.authorId) : BOTS[p.authorId]?.name ?? 'bot'
      history.unshift({ author: who, content: p.content.slice(0, 500) })
    }
    if (!history.length) throw new Error('Target post no longer exists')

    const personas = claimed.kind === 'followup'
      ? [claimed.personaId as PersonaId]
      : ((claimed.personaOrder as PersonaId[] | null) ?? [...PERSONA_IDS])
    const { replies, generator } = await generateReplies(env, personas, history)
    const now = Date.now()
    const rows = replies.map((r, i) => ({
      id: crypto.randomUUID(), authorType: 'persona' as const, authorId: r.personaId, parentId: claimed.targetPostId,
      rootId: claimed.rootPostId, content: r.content, generator, debateId: runId, createdAt: now + i,
    }))
    await db.batch([
      db.insert(posts).values(rows),
      db.update(debateRuns).set({ status: 'completed', error: null, updatedAt: Date.now() }).where(eq(debateRuns.id, runId)),
    ])
    await notify(env, claimed.rootPostId, { type: 'debate', debateId: runId, status: 'completed' })
  } catch (e) {
    const err = e as Error
    console.error('debate failed', runId, err.name, err.message)
    // public message only; the raw cause stays in logs
    const error = err.name === 'TimeoutError' ? 'The AI took too long to respond.' : 'The AI could not generate replies.'
    await db.update(debateRuns).set({ status: 'failed', error, updatedAt: Date.now() }).where(eq(debateRuns.id, runId))
    await notify(env, claimed.rootPostId, { type: 'debate', debateId: runId, status: 'failed' })
  }
}

const STALE_RUN_MS = 2 * 60_000

/** Marks runs stuck in pending/running (isolate evicted mid-generation) as failed, tells live viewers, returns them. */
async function expireStaleRuns(ctx: Ctx, rootIds: string[]) {
  if (!rootIds.length) return []
  const cutoff = Date.now() - STALE_RUN_MS
  const expired = await inChunks(rootIds, async (c) => ctx.db.update(debateRuns)
    .set({ status: 'failed', error: 'The AI took too long to respond.', updatedAt: Date.now() })
    .where(and(inArray(debateRuns.rootPostId, c), inArray(debateRuns.status, ['pending', 'running']), lt(debateRuns.updatedAt, cutoff)))
    .returning().all())
  for (const r of expired) ctx.exec.waitUntil(notify(ctx.env, r.rootPostId, { type: 'debate', debateId: r.id, status: 'failed' }))
  return expired
}

// ---------- handlers ----------
const topicOf = (content: string) => /(?:^|\s)#([A-Za-z][\w]{1,39})/.exec(content)?.[1] ?? null

async function json<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  if (!req.headers.get('content-type')?.includes('application/json')) throw new HttpError(415, 'Expected JSON')
  const body = await req.text()
  if (body.length > 8_000) throw new HttpError(413, 'Request too large')
  let data: unknown
  try { data = JSON.parse(body) } catch { throw new HttpError(400, 'Invalid JSON') }
  const parsed = schema.safeParse(data)
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid input')
  return parsed.data
}

async function getPost(db: DB, id: string) {
  const post = await db.select().from(posts).where(eq(posts.id, id)).get()
  if (!post) throw new HttpError(404, 'Post not found')
  return post
}

async function threadView(ctx: Ctx, rootId: string): Promise<ThreadView> {
  await expireStaleRuns(ctx, [rootId])
  const rows = await ctx.db.select().from(posts).where(eq(posts.rootId, rootId)).orderBy(asc(posts.createdAt)).limit(LIMITS.threadPosts + 50).all()
  const root = rows.find((r) => r.id === rootId)
  if (!root) throw new HttpError(404, 'Post not found')
  const views = await toViews(ctx, rows)
  const runs = await ctx.db.select().from(debateRuns).where(eq(debateRuns.rootPostId, rootId)).orderBy(asc(debateRuns.createdAt)).all()
  return { root: views.find((v) => v.id === rootId)!, posts: views, debates: runs.map((r) => runView(r, ctx.visitor?.id)) }
}

async function createPost(ctx: Ctx) {
  const input = await json(ctx.req, PostInput)
  const visitor = await requireVisitor(ctx)
  const { db } = ctx
  const now = Date.now()

  const recent = await usage(ctx, 'post', now - LIMITS.postWindowMs)
  if (recent.mine >= LIMITS.postsPerWindow || recent.ip >= LIMITS.postsPerIpPerWindow) throw new HttpError(429, 'You are posting too fast. Take a breath and try again in a few minutes.')

  const id = crypto.randomUUID()
  let rootId = id
  let run: Run | null = null

  if (input.parentId) {
    const parent = await getPost(db, input.parentId)
    rootId = parent.rootId
    const size = await db.select({ n: count() }).from(posts).where(eq(posts.rootId, rootId)).get()
    if ((size?.n ?? 0) >= LIMITS.threadPosts) throw new HttpError(409, 'This thread is full.')
    if (parent.authorType === 'persona') {
      const runs = await db.select({ n: count() }).from(usageEvents).where(and(eq(usageEvents.kind, 'ai'), eq(usageEvents.rootId, rootId))).get()
      if ((runs?.n ?? 0) >= DEBATE_LIMITS.runsPerThread) throw new HttpError(409, 'Debate limit reached for this thread. Start a new opinion to keep debating.')
      await aiBudgetLeft(ctx)
      run = { id: crypto.randomUUID(), rootPostId: rootId, targetPostId: id, visitorId: visitor.id, kind: 'followup', personaId: parent.authorId, personaOrder: null, status: 'pending', error: null, createdAt: now, updatedAt: now }
    }
  } else {
    await aiBudgetLeft(ctx)
    run = { id: crypto.randomUUID(), rootPostId: id, targetPostId: id, visitorId: visitor.id, kind: 'initial', personaId: null, personaOrder: input.personaOrder ?? [...PERSONA_IDS], status: 'pending', error: null, createdAt: now, updatedAt: now }
  }

  const post: Post = {
    id, authorType: 'human', authorId: visitor.id, parentId: input.parentId ?? null, rootId,
    content: input.content, media: input.media ?? null, topic: input.parentId ? null : topicOf(input.content),
    generator: null, debateId: null, createdAt: now,
  }
  const log = [usageRow(ctx, 'post', { rootId }), ...(run ? [usageRow(ctx, 'ai', { rootId, runId: run.id })] : [])]
  if (run) await db.batch([db.insert(posts).values(post), db.insert(debateRuns).values(run), db.insert(usageEvents).values(log)])
  else await db.batch([db.insert(posts).values(post), db.insert(usageEvents).values(log)])

  if (run) ctx.exec.waitUntil(runDebate(ctx.env, run.id))
  if (input.parentId) ctx.exec.waitUntil(notify(ctx.env, rootId, { type: 'post', postId: id }))
  const [view] = await toViews(ctx, [post])
  return Response.json({ post: view, debate: run ? runView(run, visitor.id) : null }, { status: 201 })
}

async function toggle(ctx: Ctx, table: typeof reactions | typeof bookmarks, postId: string) {
  const visitor = await requireVisitor(ctx)
  await getPost(ctx.db, postId)
  const removed = await ctx.db.delete(table).where(and(eq(table.visitorId, visitor.id), eq(table.postId, postId))).returning().all()
  if (!removed.length) await ctx.db.insert(table).values({ visitorId: visitor.id, postId, createdAt: Date.now() }).onConflictDoNothing()
  return !removed.length
}

const ID = '([\\w-]{1,40})'
type Handler = (ctx: Ctx, ...params: string[]) => Promise<Response | unknown>
const routes: [string, RegExp, Handler][] = [
  ['GET', /^\/api\/me$/, async (ctx) => {
    // Reads never create sessions; the first write does. Until then show a neutral identity.
    const v = ctx.visitor
    return v ? { id: v.id, ...guestIdentity(v.id), aiMode: aiMode(ctx.env) } : { id: '', ...guestIdentity('guest'), name: 'You', handle: 'guest', aiMode: aiMode(ctx.env) }
  }],
  ['GET', /^\/api\/me\/debate$/, async (ctx) => {
    if (!ctx.visitor) return null
    const root = await ctx.db.select({ id: posts.id }).from(posts)
      .where(and(eq(posts.authorType, 'human'), eq(posts.authorId, ctx.visitor.id), isNull(posts.parentId)))
      .orderBy(desc(posts.createdAt)).limit(1).get()
    return root ? threadView(ctx, root.id) : null
  }],
  ['GET', /^\/api\/feed$/, async (ctx) => {
    const tab = z.enum(FEED_TABS).catch('all').parse(ctx.url.searchParams.get('tab'))
    const res = await page(ctx, [
      isNull(posts.parentId),
      tab === 'debates' ? eq(posts.authorType, 'human') : undefined,
      tab === 'media' ? isNotNull(posts.media) : undefined,
    ], true)
    const pendingRoots = res.posts.filter((p) => p.debate && (p.debate.status === 'pending' || p.debate.status === 'running'))
    const expired = new Map((await expireStaleRuns(ctx, pendingRoots.map((p) => p.id))).map((r) => [r.id, r]))
    for (const p of pendingRoots) {
      const r = expired.get(p.debate!.id)
      if (r) p.debate = { ...p.debate!, status: 'failed', error: r.error }
    }
    return res
  }],
  ['GET', /^\/api\/search$/, async (ctx) => {
    const sp = ctx.url.searchParams
    const q = (sp.get('q') ?? '').trim().slice(0, 100)
    const authorFilter = z.enum(AUTHOR_FILTERS).catch('all').parse(sp.get('author') ?? 'all')
    const topic = sp.get('topic')?.replace(/^#/, '').slice(0, 40)
    const escaped = q.replace(/[\\%_]/g, (c) => `\\${c}`)
    return page(ctx, [
      q ? sql`${posts.content} LIKE ${`%${escaped}%`} ESCAPE '\\'` : undefined,
      topic ? eq(posts.topic, topic) : undefined,
      authorFilter === 'human' ? eq(posts.authorType, 'human')
        : authorFilter === 'ai' ? inArray(posts.authorType, ['persona', 'bot'])
        : authorFilter !== 'all' ? and(eq(posts.authorType, 'persona'), eq(posts.authorId, authorFilter))
        : undefined,
    ], false)
  }],
  ['GET', /^\/api\/saved$/, async (ctx) => {
    if (!ctx.visitor) return { posts: [], nextCursor: null }
    const rows = await ctx.db.select({ post: posts }).from(bookmarks).innerJoin(posts, eq(posts.id, bookmarks.postId))
      .where(eq(bookmarks.visitorId, ctx.visitor.id)).orderBy(desc(bookmarks.createdAt)).limit(100).all()
    return { posts: await toViews(ctx, rows.map((r) => r.post)), nextCursor: null }
  }],
  ['GET', /^\/api\/trending$/, async (ctx): Promise<TrendingTopic[]> => {
    const rows = await ctx.db.select({
      topic: posts.topic, n: count(), human: sql<number>`sum(case when ${posts.authorType} = 'human' then 1 else 0 end)`,
    }).from(posts).where(isNotNull(posts.topic)).groupBy(posts.topic).orderBy(desc(count())).limit(5).all()
    return rows.map((r) => {
      const share = r.human / r.n
      return { topic: r.topic!, count: r.n, mix: share >= 0.6 ? 'human' : share <= 0.25 ? 'ai' : 'mixed' }
    })
  }],
  ['GET', /^\/api\/stats$/, async (ctx): Promise<Stats> => {
    const db = ctx.db
    const [byType, today, accounts] = await Promise.all([
      db.select({ type: posts.authorType, n: count() }).from(posts).groupBy(posts.authorType).all(),
      db.select({ n: count() }).from(posts).where(gte(posts.createdAt, Date.now() - DAY)).get(),
      db.select({ type: posts.authorType, n: sql<number>`count(distinct ${posts.authorId})` }).from(posts).groupBy(posts.authorType).all(),
    ])
    const postsByType = { human: 0, persona: 0, bot: 0 }
    for (const r of byType) postsByType[r.type] = r.n
    const activeAccounts = { human: 0, persona: 0, bot: 0 }
    for (const r of accounts) activeAccounts[r.type] = r.n
    return { postsByType, postsToday: today?.n ?? 0, aiReplies: postsByType.persona, activeAccounts }
  }],
  ['POST', /^\/api\/posts$/, createPost],
  ['GET', new RegExp(`^/api/posts/${ID}/thread$`), async (ctx, id) => threadView(ctx, (await getPost(ctx.db, id)).rootId)],
  ['DELETE', new RegExp(`^/api/posts/${ID}$`), async (ctx, id) => {
    const visitor = await requireVisitor(ctx)
    const post = await getPost(ctx.db, id)
    if (post.authorType !== 'human' || post.authorId !== visitor.id) throw new HttpError(403, 'You can only delete your own posts.')
    await ctx.db.delete(posts).where(eq(posts.id, id))
    ctx.exec.waitUntil(notify(ctx.env, post.rootId, { type: 'post', postId: id }))
    return { ok: true }
  }],
  ['POST', new RegExp(`^/api/posts/${ID}/like$`), async (ctx, id) => {
    const liked = await toggle(ctx, reactions, id)
    const total = await ctx.db.select({ n: count() }).from(reactions).where(eq(reactions.postId, id)).get()
    return { liked, likeCount: total?.n ?? 0 }
  }],
  ['POST', new RegExp(`^/api/posts/${ID}/bookmark$`), async (ctx, id) => ({ bookmarked: await toggle(ctx, bookmarks, id) })],
  ['POST', new RegExp(`^/api/debates/${ID}/retry$`), async (ctx, id) => {
    const visitor = await requireVisitor(ctx)
    const run = await ctx.db.select().from(debateRuns).where(eq(debateRuns.id, id)).get()
    if (!run) throw new HttpError(404, 'Debate not found')
    if (run.visitorId !== visitor.id) throw new HttpError(403, 'Only the author can retry this debate.')
    await expireStaleRuns(ctx, [run.rootPostId])
    const current = await ctx.db.select().from(debateRuns).where(eq(debateRuns.id, id)).get()
    if (current?.status !== 'failed') throw new HttpError(409, 'Only failed debates can be retried.')
    const attempts = await ctx.db.select({ n: count() }).from(usageEvents).where(and(eq(usageEvents.kind, 'ai'), eq(usageEvents.runId, id))).get()
    if ((attempts?.n ?? 0) > LIMITS.retriesPerRun) throw new HttpError(409, 'This debate has been retried too many times. Try posting again later.')
    await aiBudgetLeft(ctx)
    const [updated] = await ctx.db.batch([
      ctx.db.update(debateRuns).set({ status: 'pending', error: null, updatedAt: Date.now() })
        .where(and(eq(debateRuns.id, id), eq(debateRuns.status, 'failed'))).returning(),
      ctx.db.insert(usageEvents).values(usageRow(ctx, 'ai', { rootId: run.rootPostId, runId: id })),
    ])
    if (!updated.length) throw new HttpError(409, 'Only failed debates can be retried.')
    ctx.exec.waitUntil(runDebate(ctx.env, id))
    return runView(updated[0], visitor.id)
  }],
  ['GET', new RegExp(`^/api/posts/${ID}/live$`), async (ctx, id) => {
    if (ctx.req.headers.get('upgrade')?.toLowerCase() !== 'websocket') throw new HttpError(426, 'Expected WebSocket')
    const post = await getPost(ctx.db, id)
    if (post.parentId) throw new HttpError(400, 'Subscribe to the thread root')
    const forwarded = new Request(ctx.req)
    forwarded.headers.set('x-client-ip', ctx.ip)
    return ctx.env.THREAD_ROOM.get(ctx.env.THREAD_ROOM.idFromName(post.id)).fetch(forwarded)
  }],
]

/** Reject cross-site state changes and socket upgrades (cookies are SameSite=Lax, this is defense in depth). */
function sameOrigin(req: Request, url: URL) {
  const site = req.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return false
  const origin = req.headers.get('origin')
  if (!origin) return false
  try { return new URL(origin).host === url.host } catch { return false }
}

async function handleApi(req: Request, env: Env, exec: ExecutionContext): Promise<Response> {
  const url = new URL(req.url)
  const db = drizzle(env.DB, { schema })
  const ctx: Ctx = { req, url, env, exec, db, ip: req.headers.get('cf-connecting-ip') ?? 'local', visitor: null }
  try {
    const route = routes.find(([m, re]) => m === req.method && re.test(url.pathname))
    if (!route) {
      const known = routes.some(([, re]) => re.test(url.pathname))
      throw new HttpError(known ? 405 : 404, known ? 'Method not allowed' : 'Not found')
    }
    const mutating = req.method !== 'GET' || req.headers.get('upgrade')
    if (mutating && !sameOrigin(req, url)) throw new HttpError(403, 'Cross-origin request blocked')

    ctx.visitor = await loadVisitor(db, req)
    const params = route[1].exec(url.pathname)!.slice(1)
    const result = await route[2](ctx, ...params)
    const res = result instanceof Response ? result : Response.json(result)
    if (res.status === 101) return res
    const headers = new Headers(res.headers)
    headers.set('cache-control', 'no-store')
    headers.set('x-content-type-options', 'nosniff')
    if (ctx.setCookie) headers.append('set-cookie', ctx.setCookie)
    return new Response(res.body, { status: res.status, headers })
  } catch (e) {
    if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status, headers: { 'cache-control': 'no-store' } })
    console.error('api error', req.method, url.pathname, (e as Error).message)
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export default {
  async fetch(req, env, ctx) {
    // Static assets are served before the Worker runs (run_worker_first: /api/*).
    return handleApi(req, env, ctx)
  },
} satisfies ExportedHandler<Env>
