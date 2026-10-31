import { describe, it, expect } from 'vitest'
import { exports } from 'cloudflare:workers'
import { parseReplies } from '../worker/ai'
import type { CreatePostResult, Me, Page, ThreadView } from '../shared/contract'

const ORIGIN = 'http://example.com'

/** Minimal cookie-keeping guest client against the real Worker. */
function guest() {
  let cookie = ''
  return async (path: string, init: RequestInit & { json?: unknown } = {}) => {
    const headers = new Headers(init.headers)
    if (cookie) headers.set('cookie', cookie)
    if (init.method && init.method !== 'GET') headers.set('origin', ORIGIN)
    if (init.json !== undefined) headers.set('content-type', 'application/json')
    const res = await exports.default.fetch(new Request(`${ORIGIN}/api${path}`, {
      ...init, headers, body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    }))
    const set = res.headers.get('set-cookie')
    if (set) cookie = set.split(';')[0]
    return res
  }
}

async function waitForDebate(client: ReturnType<typeof guest>, id: string): Promise<ThreadView> {
  for (let i = 0; i < 50; i++) {
    const t: ThreadView = await (await client(`/posts/${id}/thread`)).json()
    if (t.root.debate && ['completed', 'failed'].includes(t.root.debate.status)) return t
    await new Promise((r) => setTimeout(r, 50))
  }
  throw new Error('debate did not finish')
}

describe('posting', () => {
  it('rejects invalid post input', async () => {
    const c = guest()
    for (const json of [{ content: '' }, { content: '   ' }, { content: 'x'.repeat(501) }, { content: 'ok', media: { type: 'pixel-scene', version: 9 } }, { content: 'ok', personaOrder: ['skeptic', 'skeptic', 'devil', 'optimist'] }]) {
      const res = await c('/posts', { method: 'POST', json })
      expect(res.status, JSON.stringify(json)).toBe(400)
    }
    expect((await c('/posts', { method: 'POST', body: 'nope', headers: { 'content-type': 'application/json' } })).status).toBe(400)
  })

  it('blocks cross-origin writes', async () => {
    const res = await exports.default.fetch(new Request(`${ORIGIN}/api/posts`, {
      method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.test' }, body: JSON.stringify({ content: 'hi' }),
    }))
    expect(res.status).toBe(403)
  })

  it('persists an opinion and its AI replies across reloads', async () => {
    const c = guest()
    const me: Me = await (await c('/me')).json()
    expect(me.aiMode).toBe('demo') // no credentials in tests

    const res = await c('/posts', { method: 'POST', json: { content: 'Remote work is better for everyone. #WorkLife', personaOrder: ['optimist', 'devil', 'skeptic', 'philosopher'] } })
    expect(res.status).toBe(201)
    const { post, debate }: CreatePostResult = await res.json()
    expect(post.isOwn).toBe(true)
    expect(post.topic).toBe('WorkLife')
    expect(debate?.status).toBe('pending')

    const thread = await waitForDebate(c, post.id)
    expect(thread.root.debate?.status).toBe('completed')
    const replies = thread.posts.filter((p) => p.parentId === post.id)
    expect(replies.map((r) => r.author.id)).toEqual(['optimist', 'devil', 'skeptic', 'philosopher'])
    expect(replies.every((r) => r.generator === 'demo' && r.author.type === 'persona')).toBe(true)
    expect(new Set(replies.map((r) => r.content)).size).toBe(4)

    // "reload": a fresh read sees the same persisted data, and the feed shows the preview
    const again: ThreadView = await (await c(`/posts/${post.id}/thread`)).json()
    expect(again.posts.map((p) => p.id)).toEqual(thread.posts.map((p) => p.id))
    const feed: Page = await (await c('/feed?tab=debates')).json()
    const inFeed = feed.posts.find((p) => p.id === post.id)!
    expect(inFeed.replyCount).toBe(4)
    expect(inFeed.replies).toHaveLength(4)

    // follow-up to one persona produces exactly one reply from that persona
    const skeptic = replies.find((r) => r.author.id === 'skeptic')!
    const fu: CreatePostResult = await (await c('/posts', { method: 'POST', json: { content: 'Productivity data backs me up.', parentId: skeptic.id } })).json()
    expect(fu.debate?.kind).toBe('followup')
    const after = await waitForDebate(c, post.id)
    const answer = after.posts.filter((p) => p.parentId === fu.post.id)
    expect(answer).toHaveLength(1)
    expect(answer[0].author.id).toBe('skeptic')
  })

  it('rate limits rapid posting', async () => {
    const c = guest()
    const statuses: number[] = []
    for (let i = 0; i < 10; i++) statuses.push((await c('/posts', { method: 'POST', json: { content: `post ${i}` } })).status)
    expect(statuses.slice(0, 8).every((s) => s === 201)).toBe(true)
    expect(statuses.at(-1)).toBe(429)
  })
})

describe('ownership', () => {
  it('keeps bookmarks private and owned posts protected', async () => {
    const alice = guest()
    const bob = guest()
    const { post }: CreatePostResult = await (await alice('/posts', { method: 'POST', json: { content: 'Alice was here' } })).json()

    expect((await (await alice(`/posts/${post.id}/bookmark`, { method: 'POST', json: {} })).json<{ bookmarked: boolean }>()).bookmarked).toBe(true)
    const bobSaved: Page = await (await bob('/saved')).json()
    expect(bobSaved.posts).toHaveLength(0)

    // Bob toggling only affects Bob's own bookmark
    expect((await (await bob(`/posts/${post.id}/bookmark`, { method: 'POST', json: {} })).json<{ bookmarked: boolean }>()).bookmarked).toBe(true)
    expect((await (await bob(`/posts/${post.id}/bookmark`, { method: 'POST', json: {} })).json<{ bookmarked: boolean }>()).bookmarked).toBe(false)
    const aliceSaved: Page = await (await alice('/saved')).json()
    expect(aliceSaved.posts.map((p) => p.id)).toEqual([post.id])

    // Bob cannot delete Alice's post; Alice can
    expect((await bob(`/posts/${post.id}`, { method: 'DELETE' })).status).toBe(403)
    expect((await alice(`/posts/${post.id}`, { method: 'DELETE' })).status).toBe(200)
    expect((await alice(`/posts/${post.id}/thread`)).status).toBe(404)
  })

  it('only lets the author retry a debate', async () => {
    const alice = guest()
    const bob = guest()
    const { debate }: CreatePostResult = await (await alice('/posts', { method: 'POST', json: { content: 'Retry me' } })).json()
    expect((await bob(`/debates/${debate!.id}/retry`, { method: 'POST', json: {} })).status).toBe(403)
  })
})

describe('live thread room', () => {
  it('notifies connected sockets when a reply is posted', async () => {
    const c = guest()
    const { post }: CreatePostResult = await (await c('/posts', { method: 'POST', json: { content: 'Socket test' } })).json()
    await waitForDebate(c, post.id)

    const res = await c(`/posts/${post.id}/live`, { headers: { upgrade: 'websocket', origin: ORIGIN } })
    expect(res.status).toBe(101)
    const ws = res.webSocket!
    ws.accept()
    const got = new Promise<string>((resolve) => ws.addEventListener('message', (e) => resolve(e.data as string)))
    const { post: reply }: CreatePostResult = await (await c('/posts', { method: 'POST', json: { content: 'hello room', parentId: post.id } })).json()
    expect(JSON.parse(await got)).toEqual({ type: 'post', postId: reply.id })
    ws.close()
  })
})

describe('model output validation', () => {
  const four = ['skeptic', 'philosopher', 'devil', 'optimist'] as const
  const ok = JSON.stringify({ replies: four.map((persona) => ({ persona, content: `${persona} says hi` })) })

  it('accepts well-formed output (including fenced JSON) in the requested order', () => {
    expect(parseReplies(ok, [...four]).map((r) => r.personaId)).toEqual([...four])
    expect(parseReplies('```json\n' + ok + '\n```', ['devil', 'skeptic', 'optimist', 'philosopher'])[0].personaId).toBe('devil')
  })

  it('rejects malformed output safely', () => {
    const bad = [
      'not json at all',
      '{"replies": "nope"}',
      JSON.stringify({ replies: [{ persona: 'skeptic', content: 'only one' }] }),
      JSON.stringify({ replies: four.map((persona) => ({ persona: persona === 'devil' ? 'hacker' : persona, content: 'x' })) }),
      JSON.stringify({ replies: four.map((persona) => ({ persona, content: '' })) }),
      JSON.stringify({ replies: [...four, 'skeptic'].map((persona) => ({ persona, content: 'dup' })) }),
    ]
    for (const raw of bad) expect(() => parseReplies(raw, [...four]), raw).toThrow()
  })
})
