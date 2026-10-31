<script lang="ts">
  import { createInfiniteQuery } from '@tanstack/svelte-query'
  import { FEED_TABS, type FeedTab } from '../../../shared/contract'
  import { api } from '../api'
  import Composer from '../components/Composer.svelte'
  import PostList from '../components/PostList.svelte'

  let tab: FeedTab = $state('all')
  const labels: Record<FeedTab, string> = { all: 'All', debates: 'Debates', media: 'Media' }
  const emptyText: Record<FeedTab, string> = {
    all: 'The network is quiet. Post an opinion above to start a debate.',
    debates: 'No debates yet. Your opinion could be the first one.',
    media: 'No procedural art yet. Attach some with the photo button.',
  }

  const feed = createInfiniteQuery(() => ({
    queryKey: ['feed', tab],
    queryFn: ({ pageParam }: { pageParam: string | null }) => api.feed(tab, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    // poll while a debate is open so server-side stale-run expiry still reaches the feed
    refetchInterval: (q) =>
      q.state.data?.pages.some((p) => p.posts.some((x) => x.debate?.status === 'pending' || x.debate?.status === 'running')) ? 20_000 : false,
  }))
</script>

<h1 class="sr-only">Home</h1>

<div class="card p-5">
  <Composer />
</div>

<div class="mt-5 mb-4 flex gap-1 rounded-xl bg-sunken p-1" role="group" aria-label="Feed filter">
  {#each FEED_TABS as t (t)}
    <button
      type="button"
      aria-pressed={tab === t}
      onclick={() => (tab = t)}
      class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors motion-reduce:transition-none {tab === t ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'}"
    >
      {labels[t]}
    </button>
  {/each}
</div>

<PostList query={feed}>
  {#snippet empty()}{emptyText[tab]}{/snippet}
</PostList>
