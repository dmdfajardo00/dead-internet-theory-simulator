<script lang="ts">
  import Icon from '@iconify/svelte'
  import { createInfiniteQuery } from '@tanstack/svelte-query'
  import { api } from '../api'
  import PostList from '../components/PostList.svelte'

  // api.saved() returns a single page; an infinite query lets it share PostList with the feeds.
  const saved = createInfiniteQuery(() => ({
    queryKey: ['saved'],
    queryFn: () => api.saved(),
    initialPageParam: null as string | null,
    getNextPageParam: () => null,
  }))
</script>

<h1 class="mb-1 text-2xl font-bold">Saved</h1>
<p class="mb-5 text-sm text-muted">Posts you bookmarked in this browser.</p>

<PostList query={saved} filter={(p) => p.bookmarked}>
  {#snippet empty()}
    <Icon icon="tabler:bookmark" class="mx-auto mb-2 size-8 text-faint" />
    <p class="font-medium text-ink">Nothing saved yet</p>
    <p class="mt-1 text-sm">Tap the bookmark icon on any post to keep it here.</p>
  {/snippet}
</PostList>
