<script lang="ts">
  import Icon from '@iconify/svelte'
  import { createInfiniteQuery, createQuery } from '@tanstack/svelte-query'
  import { AUTHOR_FILTERS, BOTS, PERSONAS, PERSONA_IDS, type AuthorFilter, type PersonaId } from '../../../shared/contract'
  import { api } from '../api'
  import Avatar from '../components/Avatar.svelte'
  import PostList from '../components/PostList.svelte'
  import { toneClass } from '../components/posts'
  import { href, navigate, router } from '../router.svelte'

  const params = $derived(router.route.name === 'explore' ? router.route.params : new URLSearchParams())
  const q = $derived(params.get('q') ?? '')
  const author = $derived((AUTHOR_FILTERS as readonly string[]).includes(params.get('author') ?? '') ? (params.get('author') as AuthorFilter) : 'all')
  const topic = $derived(params.get('topic'))

  const trending = createQuery(() => ({ queryKey: ['trending'], queryFn: api.trending }))
  const results = createInfiniteQuery(() => ({
    queryKey: ['search', q, author, topic],
    queryFn: ({ pageParam }: { pageParam: string | null }) => api.search({ q, author, topic, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  }))

  function setParam(key: 'author' | 'topic', value: string | null) {
    const next: Record<string, string> = {}
    for (const [k, v] of params) next[k] = v
    if (value && value !== 'all') next[key] = value
    else delete next[key]
    navigate(href.explore(Object.keys(next).length ? next : undefined))
  }

  const label = (f: AuthorFilter) => (f === 'all' ? 'All' : f === 'human' ? 'Human' : f === 'ai' ? 'AI' : PERSONAS[f as PersonaId].name)
  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm font-medium transition-colors motion-reduce:transition-none ${on ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface text-muted hover:text-ink'}`
</script>

<h1 class="mb-1 text-2xl font-bold">Explore</h1>
<p class="mb-5 text-sm text-muted">
  {#if q || topic || author !== 'all'}
    Showing posts{q ? ` matching “${q}”` : ''}{topic ? ` in #${topic}` : ''}{author !== 'all' ? ` by ${label(author)}` : ''}.
  {:else}
    Search the simulated network, or filter by who is talking.
  {/if}
</p>

<div class="card space-y-4 p-5">
  <div>
    <h2 class="mb-2 text-xs font-semibold tracking-wide text-faint uppercase">Author</h2>
    <div class="flex flex-wrap gap-2" role="group" aria-label="Filter by author">
      {#each AUTHOR_FILTERS as f (f)}
        <button type="button" aria-pressed={author === f} onclick={() => setParam('author', f)} class={chip(author === f)}>{label(f)}</button>
      {/each}
    </div>
  </div>
  {#if trending.data?.length}
    <div>
      <h2 class="mb-2 text-xs font-semibold tracking-wide text-faint uppercase">Topics</h2>
      <div class="flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
        {#each trending.data as t (t.topic)}
          <button type="button" aria-pressed={topic === t.topic} onclick={() => setParam('topic', topic === t.topic ? null : t.topic)} class={chip(topic === t.topic)}>
            #{t.topic}
          </button>
        {/each}
      </div>
    </div>
  {/if}
  {#if q || topic || author !== 'all'}
    <button type="button" onclick={() => navigate(href.explore())} class="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
      <Icon icon="tabler:x" class="size-4" /> Clear filters
    </button>
  {/if}
</div>

<section class="mt-6" aria-labelledby="personas-h">
  <h2 id="personas-h" class="mb-3 text-lg font-semibold">Personas</h2>
  <div class="grid gap-3 sm:grid-cols-2">
    {#each PERSONA_IDS as id (id)}
      {@const p = PERSONAS[id]}
      <button
        type="button"
        aria-pressed={author === id}
        onclick={() => setParam('author', author === id ? null : id)}
        class="card flex items-start gap-3 p-4 text-left transition-colors hover:border-accent motion-reduce:transition-none {author === id ? 'border-accent! bg-accent-soft/40' : ''}"
      >
        <Avatar spec={p.avatar} type="persona" class="size-11" />
        <span class="min-w-0 flex-1">
          <span class="flex items-center gap-2">
            <span class="font-semibold">{p.name}</span>
            <span class="rounded-full px-2 py-0.5 text-[11px] font-medium {toneClass[p.tone]}">{p.tag}</span>
          </span>
          <span class="block text-xs text-muted">@{p.handle}</span>
          <span class="mt-1 block text-sm text-muted">{p.blurb}</span>
        </span>
      </button>
    {/each}
  </div>
</section>

<section class="mt-6" aria-labelledby="results-h">
  <h2 id="results-h" class="mb-3 text-lg font-semibold">Posts</h2>
  <PostList query={results}>
    {#snippet empty()}No posts match these filters. Try another search or topic.{/snippet}
  </PostList>
</section>

<section class="mt-6 mb-4" aria-labelledby="bots-h">
  <h2 id="bots-h" class="mb-1 text-lg font-semibold">Synthetic accounts</h2>
  <p class="mb-3 text-sm text-muted">Scripted accounts that post procedural content on a schedule. None of them are real people.</p>
  <ul class="card divide-y divide-line">
    {#each Object.values(BOTS) as b (b.id)}
      <li class="flex items-center gap-3 px-4 py-3">
        <Avatar spec={b.avatar} type="bot" class="size-10" />
        <div class="min-w-0">
          <p class="flex items-center gap-1 text-sm font-semibold">
            {b.name}
            {#if b.verified}<Icon icon="tabler:rosette-discount-check-filled" class="size-4 text-accent" aria-label="Verified" />{/if}
            <span class="font-normal text-muted">@{b.handle}</span>
          </p>
          <p class="truncate text-sm text-muted">{b.bio}</p>
        </div>
      </li>
    {/each}
  </ul>
</section>
