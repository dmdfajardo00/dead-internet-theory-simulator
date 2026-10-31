<script lang="ts">
  import Icon from '@iconify/svelte'
  import { createQuery } from '@tanstack/svelte-query'
  import { tick } from 'svelte'
  import { PERSONAS, type AuthorType, type TrendingTopic } from '../../../shared/contract'
  import { api } from '../api'
  import { mulberry32 } from '../media/engine'
  import { prefs } from '../prefs.svelte'
  import { href, navigate, router } from '../router.svelte'
  import Avatar from './Avatar.svelte'
  import { compact, timeAgo, toneClass } from './posts'

  const debate = createQuery(() => ({ queryKey: ['myDebate'], queryFn: api.myDebate }))
  const stats = createQuery(() => ({ queryKey: ['stats'], queryFn: api.stats }))
  const trending = createQuery(() => ({ queryKey: ['trending'], queryFn: api.trending }))

  const aiResponses = $derived(debate.data ? debate.data.posts.filter((p) => p.author.type === 'persona').length : 0)

  const ago = (t: number) => (timeAgo(t) === 'now' ? 'just now' : `${timeAgo(t)} ago`)

  async function startDebate() {
    if (router.route.name !== 'home') {
      // the route only changes on the next hashchange, so wait for it before looking for the composer
      const changed = new Promise((r) => addEventListener('hashchange', r, { once: true }))
      navigate(href.home)
      await changed
    }
    await tick()
    document.getElementById('composer-input')?.focus()
  }

  // ---- Network Insights graph: node counts proportional to real post shares, deterministic layout ----
  const TYPES: { type: AuthorType; label: string; fill: string }[] = [
    { type: 'persona', label: 'AI persona posts', fill: 'var(--color-accent)' },
    { type: 'bot', label: 'Synthetic account posts', fill: 'var(--color-faint)' },
    { type: 'human', label: 'Human posts (visitors)', fill: 'var(--color-mint)' },
  ]

  const graph = $derived.by(() => {
    const by = stats.data?.postsByType
    const total = by ? by.human + by.persona + by.bot : 0
    const shares = TYPES.map((t) => ({ ...t, pct: total ? (by![t.type] / total) * 100 : 0 }))
    const N = 30
    const counts = shares.map((s) => Math.round((s.pct / 100) * N))
    const fills = shares.flatMap((s, i) => Array<string>(counts[i]).fill(s.fill))
    const rand = mulberry32(42)
    // shuffle deterministically so colours mix across the rings
    for (let i = fills.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[fills[i], fills[j]] = [fills[j], fills[i]]
    }
    const nodes = fills.map((fill, i) => {
      const ring = i < 8 ? 34 : i < 18 ? 58 : 80
      const angle = (i / (i < 8 ? 8 : i < 18 ? 10 : 12)) * Math.PI * 2 + rand() * 0.5
      return { x: 90 + Math.cos(angle) * ring * (0.9 + rand() * 0.2), y: 90 + Math.sin(angle) * ring * (0.9 + rand() * 0.2), r: 3 + rand() * 3, fill }
    })
    const edges = nodes.map((n, i) => (i < 8 ? { x1: 90, y1: 90, x2: n.x, y2: n.y } : { x1: nodes[(i * 7) % Math.min(i, 18)].x, y1: nodes[(i * 7) % Math.min(i, 18)].y, x2: n.x, y2: n.y }))
    return { shares, nodes, edges, total }
  })

  const mix: Record<TrendingTopic['mix'], { label: string; dot: string }> = {
    ai: { label: 'Mostly AI', dot: 'bg-accent' },
    mixed: { label: 'Mixed', dot: 'bg-warn' },
    human: { label: 'Humans + AI', dot: 'bg-mint' },
  }
</script>

<div class="space-y-5 py-6">
  <!-- Your Debate -->
  <section class="card p-5" aria-labelledby="your-debate">
    <header class="mb-4 flex items-center justify-between">
      <h2 id="your-debate" class="text-lg font-semibold">Your Debate</h2>
      {#if debate.data}
        <a href={href.post(debate.data.root.id)} class="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
          View all <Icon icon="tabler:arrow-right" class="size-4" />
        </a>
      {/if}
    </header>
    {#if debate.isPending}
      <div class="h-14 animate-pulse rounded-xl bg-sunken motion-reduce:animate-none"></div>
    {:else if debate.isError}
      <p class="mb-4 text-sm text-muted">Couldn't load your debate. {debate.error.message}</p>
    {:else if debate.data}
      {@const root = debate.data.root}
      <a href={href.post(root.id)} class="mb-4 flex gap-3 rounded-xl hover:bg-sunken/60">
        <Avatar spec={root.author.avatar} type="human" class="size-12" />
        <div class="min-w-0">
          <p class="line-clamp-2 text-[15px] leading-snug">{root.content}</p>
          <p class="mt-1 text-sm text-muted">{ago(root.createdAt)} · {aiResponses} AI {aiResponses === 1 ? 'response' : 'responses'}</p>
        </div>
      </a>
    {:else}
      <p class="mb-3 text-sm text-muted">Post an opinion and four AI personas will debate it here.</p>
      <button type="button" onclick={startDebate} class="mb-4 inline-flex items-center gap-1.5 rounded-xl bg-accent-soft px-3 py-2 text-sm font-medium text-accent hover:bg-accent hover:text-white">
        Share your take <Icon icon="tabler:arrow-right" class="size-4" />
      </button>
    {/if}
    <ul class="space-y-3.5">
      {#each prefs.personaOrder as id (id)}
        {@const p = PERSONAS[id]}
        <li class="flex items-center gap-3">
          <Avatar spec={p.avatar} type="persona" alt="" class="size-10" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold">{p.name}</p>
            <p class="text-xs leading-snug text-muted">{p.blurb}</p>
          </div>
          <span class="rounded-full px-2.5 py-1 text-xs font-medium {toneClass[p.tone]}">{p.tag}</span>
        </li>
      {/each}
    </ul>
  </section>

  <!-- Network Insights -->
  <section class="card p-5" aria-labelledby="insights">
    <header class="mb-3 flex items-center justify-between">
      <h2 id="insights" class="text-lg font-semibold">Network Insights</h2>
      <span class="inline-flex items-center gap-1.5 rounded-full bg-mint-soft px-2.5 py-1 text-xs font-medium text-mint">
        <span class="size-1.5 rounded-full bg-mint"></span> This instance
      </span>
    </header>
    {#if stats.isPending}
      <div class="h-40 animate-pulse rounded-xl bg-sunken motion-reduce:animate-none"></div>
    {:else if stats.isError}
      <p class="text-sm text-muted">Stats unavailable. {stats.error.message}</p>
    {:else if stats.data}
      {@const s = stats.data}
      <div class="flex items-center gap-3">
        <svg viewBox="0 0 180 180" class="w-1/2 shrink-0" aria-hidden="true">
          {#each graph.edges as e, i (i)}
            <line {...e} stroke="var(--color-line)" stroke-width="1" />
          {/each}
          {#each graph.nodes as n, i (i)}
            <circle cx={n.x} cy={n.y} r={n.r} fill={n.fill} />
          {/each}
          <circle cx="90" cy="90" r="7" fill="var(--color-accent-strong)" />
        </svg>
        <ul class="flex-1 space-y-2.5">
          {#each graph.shares as t (t.type)}
            <li class="flex gap-2">
              <span class="mt-1.5 size-2.5 shrink-0 rounded-full" style="background: {t.fill}"></span>
              <span>
                <span class="block font-semibold tabular-nums">{t.pct.toFixed(1)}%</span>
                <span class="block text-xs leading-tight text-muted">{t.label}</span>
              </span>
            </li>
          {/each}
        </ul>
      </div>
      <dl class="mt-4 grid grid-cols-3 divide-x divide-line border-t border-line pt-4 text-center">
        <div class="flex flex-col"><dt class="text-xs text-muted">Posts today</dt><dd class="order-first text-lg font-semibold tabular-nums">{compact(s.postsToday)}</dd></div>
        <div class="flex flex-col"><dt class="text-xs text-muted">AI responses</dt><dd class="order-first text-lg font-semibold tabular-nums">{compact(s.aiReplies)}</dd></div>
        <div class="flex flex-col"><dt class="text-xs text-muted">Personas + bots</dt><dd class="order-first text-lg font-semibold tabular-nums">{compact(s.activeAccounts.persona + s.activeAccounts.bot)}</dd></div>
      </dl>
      <p class="mt-3 text-xs text-faint">Simulated network · demo data</p>
    {/if}
  </section>

  <!-- Trending -->
  <section class="card p-5" aria-labelledby="trending">
    <h2 id="trending" class="mb-3 text-lg font-semibold">Trending Topics <span class="text-sm font-normal text-muted">(Synthetic)</span></h2>
    {#if trending.isPending}
      <div class="h-32 animate-pulse rounded-xl bg-sunken motion-reduce:animate-none"></div>
    {:else if trending.isError}
      <p class="text-sm text-muted">Trending unavailable. {trending.error.message}</p>
    {:else if !trending.data?.length}
      <p class="text-sm text-muted">No topics yet.</p>
    {:else}
      <ol class="divide-y divide-line">
        {#each trending.data.slice(0, 5) as t, i (t.topic)}
          <li class="flex items-center gap-3 py-2.5 text-sm">
            <span class="w-4 font-semibold text-muted tabular-nums">{i + 1}</span>
            <a href={href.explore({ topic: t.topic })} class="min-w-0 truncate font-semibold hover:text-accent">#{t.topic}</a>
            <span class="shrink-0 text-muted">{compact(t.count)} posts</span>
            <span class="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-muted">
              <span class="size-2 rounded-full {mix[t.mix].dot}"></span>{mix[t.mix].label}
            </span>
          </li>
        {/each}
      </ol>
    {/if}
  </section>
</div>
