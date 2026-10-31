<script lang="ts">
  import { prefs } from '../prefs.svelte'

  let { label = 'Reveal the Network' }: { label?: string } = $props()
</script>

<button
  type="button"
  role="switch"
  aria-checked={prefs.reveal}
  aria-label={label}
  onclick={() => (prefs.reveal = !prefs.reveal)}
  class="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors motion-reduce:transition-none {prefs.reveal ? 'bg-accent' : 'bg-faint'}"
>
  <span
    class="inline-block size-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none {prefs.reveal ? 'translate-x-6' : 'translate-x-1'}"
  ></span>
</button>
