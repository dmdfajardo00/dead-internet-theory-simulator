<script lang="ts">
  import Icon from '@iconify/svelte'
  import { href, navigate, router } from '../router.svelte'

  let input: HTMLInputElement | undefined = $state()
  // Mirrors ?q= while on Explore; locally editable in between.
  let value = $derived(router.route.name === 'explore' ? (router.route.params.get('q') ?? '') : '')
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform)

  function submit(e: SubmitEvent) {
    e.preventDefault()
    const params: Record<string, string> = {}
    if (router.route.name === 'explore') for (const [k, v] of router.route.params) params[k] = v
    if (value.trim()) params.q = value.trim()
    else delete params.q
    navigate(href.explore(Object.keys(params).length ? params : undefined))
  }

  function onkeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      input?.focus()
      input?.select()
    }
  }
</script>

<svelte:window {onkeydown} />

<form role="search" onsubmit={submit} class="relative flex-1">
  <Icon icon="tabler:search" class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
  <label for="global-search" class="sr-only">Search posts, personas, or topics</label>
  <input
    bind:this={input}
    bind:value
    id="global-search"
    type="search"
    autocomplete="off"
    placeholder="Search posts, personas, or topics..."
    class="h-12 w-full rounded-2xl border border-line bg-sunken pr-16 pl-12 text-[15px] text-ink placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-none"
  />
  <kbd class="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-line bg-surface px-1.5 py-0.5 font-sans text-xs text-muted sm:block">
    {isMac ? '⌘' : 'Ctrl'} K
  </kbd>
</form>
