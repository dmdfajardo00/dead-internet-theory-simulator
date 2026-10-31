import type {
  AuthorFilter, CreatePostResult, DebateView, FeedTab, LiveEvent, Me, Page, PostInput, Stats, ThreadView, TrendingTopic,
} from '../../shared/contract'

export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message) }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: init?.body ? { 'content-type': 'application/json' } : undefined,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(body?.error ?? `Request failed (${res.status})`, res.status)
  return body as T
}

const qs = (params: Record<string, string | null | undefined>) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v) p.set(k, v)
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const api = {
  me: () => req<Me>('/me'),
  feed: (tab: FeedTab, cursor?: string | null) => req<Page>(`/feed${qs({ tab, cursor })}`),
  search: (p: { q?: string; author?: AuthorFilter; topic?: string | null; cursor?: string | null }) =>
    req<Page>(`/search${qs({ q: p.q?.trim(), author: p.author === 'all' ? null : p.author, topic: p.topic, cursor: p.cursor })}`),
  saved: () => req<Page>('/saved'),
  thread: (id: string) => req<ThreadView>(`/posts/${encodeURIComponent(id)}/thread`),
  trending: () => req<TrendingTopic[]>('/trending'),
  stats: () => req<Stats>('/stats'),
  myDebate: () => req<ThreadView | null>('/me/debate'),
  createPost: (input: PostInput) => req<CreatePostResult>('/posts', { method: 'POST', body: JSON.stringify(input) }),
  deletePost: (id: string) => req<{ ok: true }>(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  like: (id: string) => req<{ liked: boolean; likeCount: number }>(`/posts/${encodeURIComponent(id)}/like`, { method: 'POST', body: '{}' }),
  bookmark: (id: string) => req<{ bookmarked: boolean }>(`/posts/${encodeURIComponent(id)}/bookmark`, { method: 'POST', body: '{}' }),
  retryDebate: (id: string) => req<DebateView>(`/debates/${encodeURIComponent(id)}/retry`, { method: 'POST', body: '{}' }),
}

/**
 * Subscribe to live notifications for a thread. Reconnects with backoff; on every
 * (re)connect `onEvent` is called with null so the caller refetches from D1.
 * Returns an unsubscribe function.
 */
export function watchThread(rootId: string, onEvent: (e: LiveEvent | null) => void): () => void {
  let ws: WebSocket | null = null
  let closed = false
  let attempt = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let ping: ReturnType<typeof setInterval> | undefined

  const connect = () => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    ws = new WebSocket(`${proto}://${location.host}/api/posts/${encodeURIComponent(rootId)}/live`)
    ws.onopen = () => {
      attempt = 0
      onEvent(null)
      ping = setInterval(() => ws?.readyState === WebSocket.OPEN && ws.send('ping'), 25_000)
    }
    ws.onmessage = (m) => {
      if (m.data === 'pong') return
      try { onEvent(JSON.parse(m.data)) } catch { /* ignore malformed frames */ }
    }
    ws.onclose = () => {
      clearInterval(ping)
      if (closed) return
      timer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** attempt++))
    }
  }
  connect()
  return () => {
    closed = true
    clearTimeout(timer)
    clearInterval(ping)
    ws?.close()
  }
}
