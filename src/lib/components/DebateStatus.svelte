<script lang="ts">
  import Icon from '@iconify/svelte'
  import { useQueryClient } from '@tanstack/svelte-query'
  import { PERSONAS, type DebateView } from '../../../shared/contract'
  import { api, watchThread } from '../api'
  import { prefs } from '../prefs.svelte'
  import Avatar from './Avatar.svelte'
  import { invalidatePosts } from './posts'

  let { debate, rootId, isOwn, watch = true }: { debate: DebateView; rootId: string; isOwn: boolean; watch?: boolean } = $props()

  const qc = useQueryClient()
  const active = $derived(debate.status === 'pending' || debate.status === 'running')
  const typing = $derived(debate.personaId ? [PERSONAS[debate.personaId]] : prefs.personaOrder.map((id) => PERSONAS[id]))
  let retrying = $state(false)
  let retryError = $state('')

  // Live refetch while the debate runs (the thread page owns its own subscription).
  $effect(() => {
    if (!watch || !active) return
    return watchThread(rootId, () => invalidatePosts(qc))
  })

  async function retry() {
    retrying = true
    retryError = ''
    try {
      await api.retryDebate(debate.id)
      await invalidatePosts(qc)
    } catch (e) {
      retryError = e instanceof Error ? e.message : 'Retry failed'
    } finally {
      retrying = false
    }
  }
</script>

{#if active}
  <div class="flex items-center gap-3 py-2 text-sm text-muted" role="status">
    <span class="flex -space-x-2">
      {#each typing as p (p.id)}
        <Avatar spec={p.avatar} alt={p.name} class="size-7 border-2 border-surface" />
      {/each}
    </span>
    <span>
      {typing.length === 1 ? `${typing[0].name} is typing` : 'Personas are typing'}
      <span class="inline-flex gap-0.5 align-middle" aria-hidden="true">
        {#each [0, 150, 300] as d (d)}
          <span class="size-1 animate-bounce rounded-full bg-accent motion-reduce:animate-none" style="animation-delay: {d}ms"></span>
        {/each}
      </span>
    </span>
  </div>
{:else if debate.status === 'failed'}
  <div class="flex flex-wrap items-center gap-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
    <Icon icon="tabler:alert-triangle" class="size-4 shrink-0" />
    <span class="flex-1">{debate.error ?? 'The debate could not be generated.'}{retryError ? ` ${retryError}` : ''}</span>
    {#if isOwn}
      <button type="button" onclick={retry} disabled={retrying} class="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1 font-medium text-danger hover:bg-surface/80 disabled:opacity-60">
        <Icon icon="tabler:refresh" class="size-4 {retrying ? 'animate-spin motion-reduce:animate-none' : ''}" />
        Retry
      </button>
    {/if}
  </div>
{/if}
