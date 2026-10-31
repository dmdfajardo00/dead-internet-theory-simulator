<script lang="ts">
  import Icon from '@iconify/svelte'
  import { useQueryClient } from '@tanstack/svelte-query'
  import type { PostView } from '../../../shared/contract'
  import { api } from '../api'
  import Media from '../media/Media.svelte'
  import { describe } from '../media/engine'
  import { prefs } from '../prefs.svelte'
  import { href, navigate, router } from '../router.svelte'
  import Avatar from './Avatar.svelte'
  import { compact, generatorLabel, invalidatePosts, isAi, ms, patchPost, postUrl, timeAgo } from './posts'

  let { post, replyingTo, onReply, small = false, highlight = false }: {
    post: PostView
    /** handle of the parent author, shown when Reveal is on */
    replyingTo?: string
    /** when set, the reply action opens an inline box instead of the thread */
    onReply?: () => void
    small?: boolean
    highlight?: boolean
  } = $props()

  const qc = useQueryClient()
  const a = $derived(post.author)
  let menuOpen = $state(false)
  let menuEl: HTMLDivElement | undefined = $state()
  let copied = $state(false)
  let busy = $state(false)
  let actionError = $state('')

  const fail = (e: unknown) => (actionError = e instanceof Error ? e.message : 'Something went wrong')

  async function toggleLike() {
    if (busy) return
    busy = true
    actionError = ''
    const prev = { liked: post.liked, likeCount: post.likeCount }
    patchPost(qc, post.id, { liked: !prev.liked, likeCount: Math.max(0, prev.likeCount + (prev.liked ? -1 : 1)) })
    try {
      patchPost(qc, post.id, await api.like(post.id))
    } catch (e) {
      patchPost(qc, post.id, prev)
      fail(e)
    } finally {
      busy = false
    }
  }

  async function toggleBookmark() {
    if (busy) return
    busy = true
    actionError = ''
    const prev = post.bookmarked
    patchPost(qc, post.id, { bookmarked: !prev })
    try {
      patchPost(qc, post.id, await api.bookmark(post.id))
      qc.invalidateQueries({ queryKey: ['saved'] })
    } catch (e) {
      patchPost(qc, post.id, { bookmarked: prev })
      fail(e)
    } finally {
      busy = false
    }
  }

  async function copyLink() {
    menuOpen = false
    try {
      await navigator.clipboard.writeText(postUrl(post.id))
      copied = true
      setTimeout(() => (copied = false), 2000)
    } catch {
      actionError = 'Could not copy the link'
    }
  }

  async function remove() {
    menuOpen = false
    if (!confirm('Delete this post? Replies in its thread will be removed too.')) return
    try {
      await api.deletePost(post.id)
      const r = router.route
      // leave the thread view if its root (or the routed reply) no longer exists
      if (r.name === 'post' && !post.parentId && (r.id === post.id || qc.getQueryData<{ root: { id: string } }>(['thread', r.id])?.root.id === post.id)) navigate(href.home)
      else if (r.name === 'post' && r.id === post.id) navigate(href.post(post.rootId))
      await invalidatePosts(qc)
    } catch (e) {
      fail(e)
    }
  }

  function closeMenu(e: MouseEvent | KeyboardEvent) {
    if (!menuOpen) return
    if (e instanceof KeyboardEvent ? e.key === 'Escape' : !menuEl?.contains(e.target as Node)) menuOpen = false
  }
</script>

<svelte:window onclick={closeMenu} onkeydown={closeMenu} />

<article class="flex gap-3 rounded-xl {highlight ? 'bg-accent-soft/50 -mx-2 px-2 py-1' : ''}" aria-label="Post by {a.name}">
  <Avatar spec={a.avatar} type={a.type} alt="" class={small ? 'size-9 sm:size-10' : 'size-10 sm:size-12'} />

  <div class="min-w-0 flex-1">
    {#if prefs.reveal && replyingTo}
      <p class="mb-0.5 text-xs text-faint">↳ replying to @{replyingTo}</p>
    {/if}
    <header class="flex items-start gap-2">
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[15px] leading-6">
        <span class="font-semibold text-ink">{a.name}</span>
        {#if a.verified}
          <Icon icon="tabler:rosette-discount-check-filled" class="size-4.5 text-accent" role="img" aria-hidden={false} aria-label="Verified" />
        {/if}
        <span class="truncate text-muted">@{a.handle}</span>
        {#if prefs.reveal}
          <span class="rounded-md px-1.5 text-xs leading-5 font-medium {isAi(a) ? 'bg-sunken text-muted' : 'bg-accent-soft text-accent'}">
            {isAi(a) ? 'AI' : 'Human'}
          </span>
        {/if}
        <span class="text-faint" aria-hidden="true">·</span>
        <a href={href.post(post.id)} class="text-muted hover:underline">
          <time datetime={new Date(ms(post.createdAt)).toISOString()} title={new Date(ms(post.createdAt)).toLocaleString()}>{timeAgo(post.createdAt)}</time>
        </a>
      </div>

      <div class="relative" bind:this={menuEl}>
        <button
          type="button"
          onclick={() => (menuOpen = !menuOpen)}
          aria-label="Post options"
          aria-expanded={menuOpen}
          class="-mt-1 grid size-8 place-items-center rounded-full text-muted hover:bg-sunken hover:text-ink"
        >
          <Icon icon="tabler:dots" class="size-5" />
        </button>
        {#if menuOpen}
          <div class="card absolute top-8 right-0 z-20 w-44 p-1 text-sm">
            <a href={href.post(post.rootId === post.id ? post.id : post.rootId)} class="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-sunken">
              <Icon icon="tabler:message-dots" class="size-4" /> Open thread
            </a>
            <button type="button" onclick={copyLink} class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-sunken">
              <Icon icon="tabler:link" class="size-4" /> Copy link
            </button>
            {#if post.isOwn}
              <button type="button" onclick={remove} class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-danger hover:bg-danger-soft">
                <Icon icon="tabler:trash" class="size-4" /> Delete
              </button>
            {/if}
          </div>
        {/if}
      </div>
    </header>

    <p class="text-[15px] leading-6 break-words whitespace-pre-line text-ink">{post.content}</p>

    {#if prefs.reveal && isAi(a) && post.generator}
      <p class="mt-1.5 inline-flex items-center gap-1 rounded-full bg-sunken px-2 py-0.5 text-xs text-muted">
        <Icon icon="tabler:sparkles" class="size-3.5 text-accent" />
        Generated by {a.name} · {generatorLabel[post.generator]}
      </p>
    {/if}

    {#if post.media}
      <figure class="mt-3">
        <div class="overflow-hidden rounded-xl border border-line">
          <Media spec={post.media} alt={describe(post.media)} class="w-full" />
        </div>
        {#if prefs.reveal}
          <figcaption class="mt-1 text-xs text-faint">Procedural art · seed {post.media.seed} · renderer v{post.media.version}</figcaption>
        {/if}
      </figure>
    {/if}

    <div class="mt-2 flex max-w-md items-center justify-between text-sm text-muted">
      {#if onReply}
        <button type="button" onclick={onReply} aria-label="Reply ({post.replyCount} replies)" class="-ml-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 hover:bg-accent-soft hover:text-accent">
          <Icon icon="tabler:message-circle" class="size-4.5" /> {post.replyCount ? compact(post.replyCount) : 'Reply'}
        </button>
      {:else}
        <a href={href.post(post.rootId)} aria-label="{post.replyCount} replies, open thread" class="-ml-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 hover:bg-accent-soft hover:text-accent">
          <Icon icon="tabler:message-circle" class="size-4.5" /> {compact(post.replyCount)}
        </a>
      {/if}
      <button
        type="button"
        onclick={toggleLike}
        aria-pressed={post.liked}
        aria-label="{post.liked ? 'Unlike' : 'Like'} ({post.likeCount})"
        class="inline-flex items-center gap-1.5 rounded-full px-2 py-1 hover:bg-danger-soft hover:text-danger {post.liked ? 'text-danger' : ''}"
      >
        <Icon icon={post.liked ? 'tabler:heart-filled' : 'tabler:heart'} class="size-4.5" /> {compact(post.likeCount)}
      </button>
      <button
        type="button"
        onclick={toggleBookmark}
        aria-pressed={post.bookmarked}
        aria-label={post.bookmarked ? 'Remove bookmark' : 'Bookmark'}
        class="rounded-full p-1.5 hover:bg-accent-soft hover:text-accent {post.bookmarked ? 'text-accent' : ''}"
      >
        <Icon icon={post.bookmarked ? 'tabler:bookmark-filled' : 'tabler:bookmark'} class="size-4.5" />
      </button>
      <span class="relative">
        <button type="button" onclick={copyLink} aria-label="Share: copy link" class="rounded-full p-1.5 hover:bg-accent-soft hover:text-accent">
          <Icon icon={copied ? 'tabler:check' : 'tabler:share'} class="size-4.5" />
        </button>
        <span class="absolute top-full right-0 text-xs whitespace-nowrap text-mint" aria-live="polite">{copied ? 'Link copied' : ''}</span>
      </span>
    </div>
    {#if actionError}
      <p class="mt-1 text-xs text-danger" role="alert">{actionError}</p>
    {/if}
  </div>
</article>
