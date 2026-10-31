<script lang="ts">
  import type { AuthorType, MediaSpec } from '../../../shared/contract'
  import Media from '../media/Media.svelte'
  import { prefs } from '../prefs.svelte'

  let { spec, type, alt = '', class: cls = 'size-12' }: { spec: MediaSpec; type?: AuthorType; alt?: string; class?: string } = $props()

  const ring = $derived(!prefs.reveal || !type ? '' : type === 'human' ? 'ring-2 ring-mint ring-offset-2 ring-offset-surface' : 'ring-2 ring-accent ring-offset-2 ring-offset-surface')
</script>

<span class="block shrink-0 overflow-hidden rounded-full bg-sunken {ring} {cls}">
  <Media {spec} {alt} class="size-full" />
</span>
