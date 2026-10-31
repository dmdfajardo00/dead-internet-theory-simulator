<script lang="ts">
  import Icon from '@iconify/svelte'
  import { createQuery, useQueryClient } from '@tanstack/svelte-query'
  import type { AuthorType, PostView } from '../../../shared/contract'
  import { api, watchThread } from '../api'
  import Composer from '../components/Composer.svelte'
  import DebateStatus from '../components/DebateStatus.svelte'
  import PostCard from '../components/PostCard.svelte'
  import { invalidatePosts } from '../components/posts'
  import { prefs } from '../prefs.svelte'
  import { href, navigate } from '../router.svelte'

  let { id }: { id: string } = $props()

  const qc = useQueryClient()
  const thread = createQuery(() => ({
    queryKey: ['thread', id],
    queryFn: () => api.thread(id),
    // poll while a debate is open so server-side stale-run expiry still reaches the page
    refetchInterval: (q) => (q.state.data?.debates.some((d) => d.status === 'pending' || d.status === 'running') ? 20_000 : false),
  }))
  const rootId = $derived(thread.data?.root.id)
  let replyingTo: string | null = $state(null)

  $effect(() => {
    if (!rootId) return
    return watchThread(rootId, () => invalidatePosts(qc))
  })

  const byId = $derived(new Map((thread.data?.posts ?? []).map((p) => [p.id, p])))
  const children = $derived.by(() => {
    const m = new Map<string, PostView[]>()
    for (const p of thread.data?.posts ?? []) if (p.parentId) m.set(p.parentId, [...(m.get(p.parentId) ?? []), p])
    return m
  })
  const openDebates = $derived((thread.data?.debates ?? []).filter((d) => d.status !== 'completed'))

  // Scroll a linked reply into view once.
  let scrolled = false
  $effect(() => {
    if (scrolled || !thread.data || id === thread.data.root.id) return
    scrolled = true
    requestAnimationFrame(() => document.getElementById(`post-${id}`)?.scrollIntoView({ block: 'center' }))
  })

  function back() {
    if (history.length > 1) history.back()
    else navigate(href.home)
  }

  // ---- Interaction map: one node per post, x = time order, y = reply depth ----
  const COLORS: Record<AuthorType, string> = { human: 'var(--color-mint)', persona: 'var(--color-accent)', bot: 'var(--color-faint)' }
  const map = $derived.by(() => {
    const posts = thread.data?.posts ?? []
    const depth = new Map<string, number>()
    const pos = new Map<string, { x: number; y: number }>()
    const nodes = posts.map((p, i) => {
      const d = p.parentId ? Math.min(5, (depth.get(p.parentId) ?? 0) + 1) : 0
      depth.set(p.id, d)
      const n = { p, x: 20 + i * 34, y: 20 + d * 34 }
      pos.set(p.id, n)
      return n
    })
    const edges = posts.flatMap((p) => {
      const a = p.parentId && pos.get(p.parentId)
      const b = pos.get(p.id)
      return a && b ? [`M${a.x},${a.y} C${a.x},${b.y} ${a.x},${b.y} ${b.x},${b.y}`] : []
    })
    const maxDepth = Math.max(0, ...depth.values())
    return { nodes, edges, w: 40 + Math.max(0, posts.length - 1) * 34, h: 40 + maxDepth * 34 }
  })
  const counts = $derived(
    (['human', 'persona', 'bot'] as const).map((t) => ({ t, n: (thread.data?.posts ?? []).filter((p) => p.author.type === t).length })),
  )
</script>

{#snippet node(p: PostView, depth: number)}
  {@const kids = children.get(p.id) ?? []}
  <li id="post-{p.id}">
    <PostCard
      post={p}
      small
      highlight={p.id === id}
      replyingTo={p.parentId ? byId.get(p.parentId)?.author.handle : undefined}
      onReply={() => (replyingTo = replyingTo === p.id ? null : p.id)}
    />
    {#if replyingTo === p.id}
      <div class="mt-3 sm:ml-13">
        <Composer parentId={p.id} replyTo={p.author} onDone={() => (replyingTo = null)} autofocus />
      </div>
    {/if}
    {#if kids.length}
      <ul class="mt-4 space-y-4 {depth < 3 ? 'ml-[17px] border-l-2 border-line pl-3 sm:ml-[19px] sm:pl-4' : ''}">
        {#each kids as k (k.id)}{@render node(k, depth + 1)}{/each}
      </ul>
    {/if}
  </li>
{/snippet}

<button type="button" onclick={back} class="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-muted hover:bg-sunken hover:text-ink">
  <Icon icon="tabler:arrow-left" class="size-4" /> Back
</button>

{#if thread.isPending}
  <div class="card animate-pulse space-y-3 p-5 motion-reduce:animate-none" aria-busy="true" aria-label="Loading thread">
    <div class="h-4 w-1/3 rounded bg-sunken"></div>
    <div class="h-4 w-full rounded bg-sunken"></div>
    <div class="h-4 w-2/3 rounded bg-sunken"></div>
  </div>
{:else if thread.isError}
  <div class="card flex flex-col items-center gap-3 p-8 text-center" role="alert">
    <Icon icon="tabler:alert-triangle" class="size-8 text-danger" />
    <p class="text-muted">{thread.error.message}</p>
    <div class="flex gap-2">
      <button type="button" onclick={() => thread.refetch()} class="rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-sunken">Try again</button>
      <a href={href.home} class="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong dark:text-app">Go home</a>
    </div>
  </div>
{:else if thread.data}
  {@const root = thread.data.root}
  {@const top = children.get(root.id) ?? []}
  <h1 class="sr-only">Thread by {root.author.name}</h1>
  <div class="card p-5">
    <PostCard post={root} onReply={() => document.getElementById('root-reply')?.querySelector('textarea')?.focus()} />

    {#each openDebates as d (d.id)}
      <div class="mt-3">
        <DebateStatus debate={d} rootId={root.id} isOwn={d.isOwn} watch={false} />
      </div>
    {/each}

    <div id="root-reply" class="mt-4 border-t border-line pt-4">
      <Composer parentId={root.id} replyTo={root.author} />
    </div>
  </div>

  {#if prefs.reveal && thread.data.posts.length > 1}
    <section class="card mt-4 p-5" aria-labelledby="map-h">
      <h2 id="map-h" class="font-semibold">Interaction map</h2>
      <p class="mb-3 text-xs text-muted">Each dot is a post, left to right in time order; lines connect replies to their parent.</p>
      <div class="overflow-x-auto">
        <svg
          width={map.w}
          height={map.h}
          role="img"
          aria-label="Thread map: {counts.map((c) => `${c.n} ${c.t} posts`).join(', ')}"
        >
          {#each map.edges as d, i (i)}
            <path {d} fill="none" stroke="var(--color-line)" stroke-width="2" />
          {/each}
          {#each map.nodes as n (n.p.id)}
            <circle cx={n.x} cy={n.y} r={n.p.id === root.id ? 9 : 7} fill={COLORS[n.p.author.type]} stroke="var(--color-surface)" stroke-width="2">
              <title>{n.p.author.name}: {n.p.content.slice(0, 80)}</title>
            </circle>
          {/each}
        </svg>
      </div>
      <ul class="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        {#each counts as c (c.t)}
          <li class="flex items-center gap-1.5">
            <span class="size-2.5 rounded-full" style="background: {COLORS[c.t]}"></span>
            {c.t === 'human' ? 'Human' : c.t === 'persona' ? 'AI persona' : 'Synthetic account'} · {c.n}
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if top.length}
    <section class="card mt-4 p-5" aria-label="Replies">
      <ul class="space-y-5">
        {#each top as p (p.id)}{@render node(p, 1)}{/each}
      </ul>
    </section>
  {:else if !openDebates.length}
    <p class="mt-4 text-center text-sm text-muted">No replies yet.</p>
  {/if}
{/if}
