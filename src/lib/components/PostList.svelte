<script lang="ts">
  import Icon from '@iconify/svelte'
  import type { CreateInfiniteQueryResult, InfiniteData } from '@tanstack/svelte-query'
  import type { Snippet } from 'svelte'
  import type { Page, PostView } from '../../../shared/contract'
  import { href } from '../router.svelte'
  import DebateStatus from './DebateStatus.svelte'
  import PostCard from './PostCard.svelte'

  let { query, empty, filter }: {
    query: CreateInfiniteQueryResult<InfiniteData<Page>, Error>
    empty: Snippet
    filter?: (p: PostView) => boolean
  } = $props()

  const posts = $derived.by(() => {
    const seen = new Set<string>()
    return (query.data?.pages ?? []).flatMap((p) => p.posts).filter((p) => !seen.has(p.id) && seen.add(p.id) && (!filter || filter(p)))
  })

  let sentinel: HTMLDivElement | undefined = $state()
  $effect(() => {
    if (!sentinel || !query.hasNextPage || query.isFetchingNextPage) return
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && query.fetchNextPage(), { rootMargin: '400px' })
    io.observe(sentinel)
    return () => io.disconnect()
  })
</script>

{#if query.isPending}
  <div class="space-y-4" aria-busy="true" aria-label="Loading posts">
    {#each [0, 1, 2] as i (i)}
      <div class="card flex animate-pulse gap-3 p-5 motion-reduce:animate-none">
        <div class="size-12 rounded-full bg-sunken"></div>
        <div class="flex-1 space-y-2.5 pt-1">
          <div class="h-3.5 w-1/3 rounded bg-sunken"></div>
          <div class="h-3.5 w-full rounded bg-sunken"></div>
          <div class="h-3.5 w-2/3 rounded bg-sunken"></div>
        </div>
      </div>
    {/each}
  </div>
{:else if query.isError && !posts.length}
  <div class="card flex flex-col items-center gap-3 p-8 text-center" role="alert">
    <Icon icon="tabler:alert-triangle" class="size-8 text-danger" />
    <p class="text-muted">{query.error?.message ?? 'Could not load posts.'}</p>
    <button type="button" onclick={() => query.refetch()} class="rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-sunken">Try again</button>
  </div>
{:else if !posts.length}
  <div class="card p-8 text-center text-muted">{@render empty()}</div>
{:else}
  <ul class="space-y-4">
    {#each posts as post (post.id)}
      {@const replies = post.replies ?? []}
      <li class="card px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
        <PostCard {post} />
        {#if replies.length || (post.debate && post.debate.status !== 'completed')}
          <div class="mt-3 ml-[19px] space-y-4 border-l-2 border-line pb-1 pl-3 sm:ml-[23px] sm:pl-5">
            {#each replies as reply (reply.id)}
              <PostCard post={reply} small replyingTo={post.author.handle} />
            {/each}
            {#if post.debate && post.debate.status !== 'completed'}
              <DebateStatus debate={post.debate} rootId={post.id} isOwn={post.isOwn} />
            {/if}
          </div>
        {/if}
        {#if post.replyCount > replies.length && replies.length}
          <a href={href.post(post.id)} class="mt-1 ml-10 inline-flex sm:ml-12 items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-accent hover:bg-accent-soft">
            View all {post.replyCount} replies <Icon icon="tabler:arrow-right" class="size-4" />
          </a>
        {/if}
      </li>
    {/each}
  </ul>
  <div bind:this={sentinel} class="py-4 text-center">
    {#if query.hasNextPage}
      <button
        type="button"
        onclick={() => query.fetchNextPage()}
        disabled={query.isFetchingNextPage}
        class="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-medium text-muted hover:bg-sunken disabled:opacity-60"
      >
        {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
      </button>
    {:else if posts.length > 3}
      <p class="text-sm text-faint">You've reached the end of this simulation.</p>
    {/if}
  </div>
{/if}
