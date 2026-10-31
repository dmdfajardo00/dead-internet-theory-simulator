// Shared client helpers for post UI: cache keys/invalidation, optimistic patches, formatting.
import type { QueryClient } from '@tanstack/svelte-query'
import { PERSONAS, type AuthorView, type Generator, type PersonaId, type PostView, type Tone } from '../../../shared/contract'

/** Refetch everything derived from posts (feed, search, saved, thread, myDebate, stats, trending). */
export const invalidatePosts = (qc: QueryClient) =>
  qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'me' })

/** Apply a patch to every cached copy of a post (feeds, nested reply previews, threads). */
export function patchPost(qc: QueryClient, id: string, patch: Partial<PostView>) {
  const walk = (data: unknown): unknown => {
    if (Array.isArray(data)) return data.map(walk)
    if (!data || typeof data !== 'object') return data
    const src = data as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const k in src) out[k] = walk(src[k])
    if (src.id === id && 'likeCount' in src) Object.assign(out, patch)
    return out
  }
  qc.setQueriesData({ predicate: (q) => q.queryKey[0] !== 'me' && q.queryKey[0] !== 'stats' && q.queryKey[0] !== 'trending' }, walk)
}

export const isAi = (a: AuthorView) => a.type !== 'human'

export const ms = (t: number) => (t < 1e12 ? t * 1000 : t)

export function timeAgo(t: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - ms(t)) / 1000))
  if (s < 45) return 'now'
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`
  if (s < 86400) return `${Math.round(s / 3600)}h`
  if (s < 7 * 86400) return `${Math.round(s / 86400)}d`
  return new Date(ms(t)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export const compact = (n: number) => new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n)

export const persona = (id: string) => PERSONAS[id as PersonaId] as (typeof PERSONAS)[PersonaId] | undefined

export const generatorLabel: Record<Exclude<Generator, null>, string> = { live: 'live model', demo: 'demo sample', seed: 'seeded' }

export const toneClass: Record<Tone, string> = {
  critical: 'bg-danger-soft text-danger',
  thoughtful: 'bg-accent-soft text-accent',
  provocative: 'bg-warn-soft text-warn',
  supportive: 'bg-mint-soft text-mint',
}

export const postUrl = (id: string) => `${location.origin}${location.pathname}#/post/${encodeURIComponent(id)}`

export const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0]
