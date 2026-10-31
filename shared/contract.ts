// Shared between the Svelte client and the Worker: public persona/bot metadata,
// procedural media specs, input schemas and API response shapes.
import { z } from 'zod'

// ---------- procedural media ----------
export const SUBJECTS = [
  'coffee', 'robot', 'cat', 'camera', 'folder', 'terminal',
  'plant', 'ghost', 'heart', 'moon', 'devil', 'sage', 'person',
] as const
export const SCENES = ['mountain-lake', 'forest-sunset', 'city-skyline', 'cozy-window'] as const
export const PALETTES = ['lavender-dusk', 'mint-morning', 'ember', 'midnight', 'pastel'] as const
export const GRAPHIC_VARIANTS = ['quote', 'poster', 'chart', 'terminal'] as const

const seed = z.number().int().min(0).max(2 ** 32 - 1)

export const MediaSpec = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('pixel-scene'),
    version: z.literal(1),
    seed,
    scene: z.enum(SCENES),
    subject: z.enum(SUBJECTS).optional(),
    palette: z.enum(PALETTES),
  }),
  z.object({
    type: z.literal('pixel-icon'),
    version: z.literal(1),
    seed,
    subject: z.enum(SUBJECTS),
    palette: z.enum(PALETTES),
  }),
  z.object({
    type: z.literal('graphic'),
    version: z.literal(1),
    seed,
    variant: z.enum(GRAPHIC_VARIANTS),
    title: z.string().trim().min(1).max(80),
    text: z.string().trim().max(200).optional(),
    data: z.array(z.number().finite().min(0).max(1000)).max(12).optional(),
  }),
])
export type MediaSpec = z.infer<typeof MediaSpec>

// ---------- personas & synthetic accounts (public metadata only; prompts live in worker/ai.ts) ----------
export const PERSONA_IDS = ['skeptic', 'philosopher', 'devil', 'optimist'] as const
export type PersonaId = (typeof PERSONA_IDS)[number]
export type Tone = 'critical' | 'thoughtful' | 'provocative' | 'supportive'

export interface PersonaMeta {
  id: PersonaId
  name: string
  handle: string
  tag: string
  tone: Tone
  blurb: string
  avatar: MediaSpec
}

const icon = (subject: (typeof SUBJECTS)[number], palette: (typeof PALETTES)[number], s: number): MediaSpec =>
  ({ type: 'pixel-icon', version: 1, seed: s, subject, palette })

export const PERSONAS: Record<PersonaId, PersonaMeta> = {
  skeptic: { id: 'skeptic', name: 'The Skeptic', handle: 'skeptic.exe', tag: 'Critical', tone: 'critical', blurb: 'Questions claims and looks for flaws.', avatar: icon('cat', 'midnight', 11) },
  philosopher: { id: 'philosopher', name: 'The Philosopher', handle: 'logos.ai', tag: 'Thoughtful', tone: 'thoughtful', blurb: 'Explores deeper meaning and context.', avatar: icon('sage', 'lavender-dusk', 23) },
  devil: { id: 'devil', name: "Devil's Advocate", handle: 'contrarian.bot', tag: 'Provocative', tone: 'provocative', blurb: 'Challenges with counterarguments.', avatar: icon('devil', 'ember', 37) },
  optimist: { id: 'optimist', name: 'The Optimist', handle: 'goodside.ai', tag: 'Supportive', tone: 'supportive', blurb: 'Looks for potential and positive angles.', avatar: icon('robot', 'mint-morning', 41) },
}

export interface BotMeta { id: string; name: string; handle: string; verified: boolean; bio: string; avatar: MediaSpec }

export const BOTS: Record<string, BotMeta> = {
  pixelbrewer: { id: 'pixelbrewer', name: 'Pixel Brewer', handle: 'pixelbrewer', verified: true, bio: 'Posts procedural sunsets on a schedule.', avatar: icon('robot', 'lavender-dusk', 101) },
  synthdaily: { id: 'synthdaily', name: 'Synth Daily', handle: 'synthdaily', verified: false, bio: 'Auto-generated takes, every hour.', avatar: icon('terminal', 'midnight', 102) },
  looptheory: { id: 'looptheory', name: 'Loop Theory', handle: 'looptheory', verified: false, bio: 'Charts about charts.', avatar: icon('folder', 'pastel', 103) },
  nullptr: { id: 'nullptr', name: 'Null Pointer', handle: 'nullptr_42', verified: false, bio: 'Simulated developer. Simulated bugs.', avatar: icon('ghost', 'mint-morning', 104) },
  miravale: { id: 'miravale', name: 'Mira Vale', handle: 'miravale', verified: true, bio: 'Synthetic lifestyle influencer.', avatar: icon('plant', 'pastel', 105) },
}

// ---------- API inputs ----------
export const POST_MAX = 500

export const PostInput = z.object({
  content: z.string().trim().min(1, 'Write something first').max(POST_MAX, `Keep it under ${POST_MAX} characters`),
  parentId: z.string().min(1).max(40).optional(),
  media: MediaSpec.optional(),
  // Preferred order of persona replies (from Settings drag-and-drop)
  personaOrder: z.array(z.enum(PERSONA_IDS)).length(4).refine((a) => new Set(a).size === 4, 'Duplicate persona').optional(),
})
export type PostInput = z.infer<typeof PostInput>

export const FEED_TABS = ['all', 'debates', 'media'] as const
export type FeedTab = (typeof FEED_TABS)[number]

export const AUTHOR_FILTERS = ['all', 'human', 'ai', ...PERSONA_IDS] as const
export type AuthorFilter = (typeof AUTHOR_FILTERS)[number]

// ---------- API responses ----------
export type AuthorType = 'human' | 'persona' | 'bot'
export type Generator = 'live' | 'demo' | 'seed' | null
export type DebateStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface AuthorView {
  type: AuthorType
  id: string
  name: string
  handle: string
  avatar: MediaSpec
  verified: boolean
}

export interface DebateView {
  id: string
  kind: 'initial' | 'followup'
  status: DebateStatus
  personaId: PersonaId | null
  error: string | null
}

export interface PostView {
  id: string
  rootId: string
  parentId: string | null
  author: AuthorView
  content: string
  media: MediaSpec | null
  topic: string | null
  generator: Generator
  createdAt: number
  replyCount: number
  likeCount: number
  liked: boolean
  bookmarked: boolean
  isOwn: boolean
  /** latest debate run for root posts that started one */
  debate: DebateView | null
  /** feed only: first few direct replies of a root post, oldest first */
  replies?: PostView[]
}

export interface Me { id: string; name: string; handle: string; avatar: MediaSpec; aiMode: 'live' | 'demo' }
export interface Page { posts: PostView[]; nextCursor: string | null }
export interface ThreadView { root: PostView; posts: PostView[]; debates: DebateView[] }
export interface TrendingTopic { topic: string; count: number; mix: 'ai' | 'human' | 'mixed' }
export interface Stats {
  postsByType: Record<AuthorType, number>
  postsToday: number
  aiReplies: number
  activeAccounts: { human: number; persona: number; bot: number }
}
export interface CreatePostResult { post: PostView; debate: DebateView | null }

/** WebSocket notifications from ThreadRoom. D1 stays canonical; clients refetch on receipt. */
export type LiveEvent =
  | { type: 'debate'; debateId: string; status: DebateStatus }
  | { type: 'post'; postId: string }

export const DEBATE_LIMITS = {
  /** debate runs (initial + follow-ups) allowed per thread */
  runsPerThread: 6,
  /** max ancestor posts sent as context for a follow-up */
  historyPosts: 8,
} as const

/** Deterministic human display identity derived from the opaque visitor id. */
export function guestIdentity(visitorId: string) {
  const tag = visitorId.replace(/[^a-z0-9]/gi, '').slice(-4).toLowerCase() || 'anon'
  let h = 0
  for (const c of visitorId) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return {
    name: `Guest ${tag.toUpperCase()}`,
    handle: `guest_${tag}`,
    avatar: { type: 'pixel-icon', version: 1, seed: h, subject: 'person', palette: PALETTES[h % PALETTES.length] } as MediaSpec,
  }
}
