<script lang="ts">
  import Icon from '@iconify/svelte'
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
  import { POST_MAX, PostInput, type AuthorView, type MediaSpec } from '../../../shared/contract'
  import { api } from '../api'
  import Media from '../media/Media.svelte'
  import { describe, randomSpec } from '../media/engine'
  import { prefs } from '../prefs.svelte'
  import Avatar from './Avatar.svelte'
  import { invalidatePosts, randomSeed } from './posts'

  let { parentId, replyTo, onDone, autofocus = false }: {
    parentId?: string
    replyTo?: AuthorView
    onDone?: () => void
    autofocus?: boolean
  } = $props()

  const qc = useQueryClient()
  const me = createQuery(() => ({ queryKey: ['me'], queryFn: api.me, staleTime: Infinity }))

  let content = $state('')
  let media: MediaSpec | null = $state(null)
  let error = $state('')
  const isReply = $derived(!!parentId)
  const remaining = $derived(POST_MAX - content.length)
  const id = $props.id()
  const textId = $derived(isReply ? `${id}-text` : 'composer-input')

  const post = createMutation(() => ({
    mutationFn: (input: PostInput) => api.createPost(input),
    onSuccess: () => {
      content = ''
      media = null
      invalidatePosts(qc)
      onDone?.()
    },
    onError: (e: Error) => (error = e.message),
  }))

  const palette = () => (prefs.palette === 'random' ? undefined : prefs.palette)

  function attachArt() {
    media = randomSpec('pixel-scene', randomSeed(), palette())
  }
  function attachQuote() {
    const text = content.trim()
    if (!text) return (error = 'Write something first, then turn it into a quote poster')
    error = ''
    media = randomSpec('graphic', randomSeed(), palette(), { title: text.length > 80 ? `${text.slice(0, 79)}…` : text })
  }
  function reroll() {
    if (media?.type === 'graphic') attachQuote()
    else attachArt()
  }

  function submit(e?: SubmitEvent) {
    e?.preventDefault()
    if (post.isPending) return
    const parsed = PostInput.safeParse({
      content,
      parentId,
      media: media ?? undefined,
      personaOrder: isReply ? undefined : $state.snapshot(prefs.personaOrder),
    })
    if (!parsed.success) return (error = parsed.error.issues[0]?.message ?? 'Invalid post')
    error = ''
    post.mutate(parsed.data)
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
  }
</script>

<form onsubmit={submit} class="flex gap-3" aria-label={isReply ? 'Write a reply' : 'Share your opinion'}>
  {#if me.data}
    <Avatar spec={me.data.avatar} type="human" alt="" class={isReply ? 'size-9' : 'size-10 sm:size-12'} />
  {:else}
    <span class="shrink-0 animate-pulse rounded-full bg-sunken motion-reduce:animate-none {isReply ? 'size-9' : 'size-10 sm:size-12'}"></span>
  {/if}

  <div class="min-w-0 flex-1">
    <label for={textId} class="sr-only">{isReply ? 'Your reply' : "What's your take?"}</label>
    <textarea
      id={textId}
      bind:value={content}
      {onkeydown}
      {@attach (node) => { if (autofocus) node.focus() }}
      rows="2"
      maxlength={POST_MAX + 50}
      placeholder={isReply ? `Reply to @${replyTo?.handle ?? 'thread'}…` : "What's your take?"}
      aria-invalid={!!error || remaining < 0}
      aria-describedby="{id}-hint"
      class="block w-full resize-y rounded-xl border border-line bg-sunken px-4 py-3 text-[15px] text-ink placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-none"
    ></textarea>

    {#if media}
      <div class="relative mt-3 overflow-hidden rounded-xl border border-line">
        <Media spec={media} alt={describe(media)} class="w-full" />
        <div class="absolute top-2 right-2 flex gap-1.5">
          <button type="button" onclick={reroll} aria-label="Reroll attachment" title="Reroll" class="grid size-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/75">
            <Icon icon="tabler:dice-5" class="size-4.5" />
          </button>
          <button type="button" onclick={() => (media = null)} aria-label="Remove attachment" title="Remove" class="grid size-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/75">
            <Icon icon="tabler:x" class="size-4.5" />
          </button>
        </div>
      </div>
    {/if}

    <div class="mt-2 flex flex-wrap items-center gap-1">
      <button type="button" onclick={attachArt} aria-label="Attach procedural pixel art" title="Attach procedural pixel art" class="grid size-9 place-items-center rounded-lg text-muted hover:bg-sunken hover:text-ink">
        <Icon icon="tabler:photo" class="size-5" />
      </button>
      <button type="button" onclick={attachQuote} aria-label="Turn text into a quote poster" title="Turn text into a quote poster" class="grid size-9 place-items-center rounded-lg text-muted hover:bg-sunken hover:text-ink">
        <Icon icon="tabler:quote" class="size-5" />
      </button>
      <span class="ml-1 text-xs tabular-nums {remaining < 0 ? 'font-semibold text-danger' : remaining < 50 ? 'text-warn' : 'text-faint'}" aria-live="polite">
        {content.length}/{POST_MAX}
      </span>
      <button
        type="submit"
        disabled={post.isPending}
        class="ml-auto inline-flex items-center gap-2 rounded-xl bg-accent px-4 font-medium text-white shadow-sm hover:bg-accent-strong dark:text-app disabled:opacity-60 {isReply ? 'h-9 text-sm' : 'h-10'}"
      >
        {#if post.isPending}<Icon icon="tabler:loader-2" class="size-4 animate-spin motion-reduce:animate-none" />{/if}
        {isReply ? 'Reply' : 'Post your opinion'}
        {#if !isReply && !post.isPending}<Icon icon="tabler:arrow-right" class="size-4" />{/if}
      </button>
    </div>

    <div id="{id}-hint" class="mt-2 space-y-1 text-[13px]">
      {#if error}
        <p class="text-danger" role="alert">{error}</p>
      {/if}
      {#if isReply}
        {#if replyTo?.type === 'persona'}
          <p class="text-muted">{replyTo.name} will respond.</p>
        {/if}
      {:else}
        <p class="text-muted">AI personas will challenge, support, and debate your opinion.</p>
        {#if me.data?.aiMode === 'demo'}
          <p class="flex items-center gap-1.5 text-warn">
            <Icon icon="tabler:info-circle" class="size-4 shrink-0" />
            Demo mode: AI replies are sample responses, no live model configured
          </p>
        {/if}
      {/if}
    </div>
  </div>
</form>
