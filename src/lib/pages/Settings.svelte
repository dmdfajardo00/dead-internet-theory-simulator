<script lang="ts">
  import Icon from '@iconify/svelte'
  import { flip } from 'svelte/animate'
  import { dndzone, type DndEvent } from 'svelte-dnd-action'
  import { PALETTES, PERSONAS, type MediaSpec, type PersonaId } from '../../../shared/contract'
  import Avatar from '../components/Avatar.svelte'
  import RevealToggle from '../components/RevealToggle.svelte'
  import { toneClass } from '../components/posts'
  import Media from '../media/Media.svelte'
  import { prefs, resetPrefs } from '../prefs.svelte'

  const themes = [
    { value: 'system', label: 'System', icon: 'tabler:device-desktop' },
    { value: 'light', label: 'Light', icon: 'tabler:sun' },
    { value: 'dark', label: 'Dark', icon: 'tabler:moon' },
  ] as const

  const flipMs = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150
  type Item = { id: string }
  // Drag state mirrors prefs; writes back only on finalize.
  let items: Item[] = $derived(prefs.personaOrder.map((id) => ({ id })))

  const consider = (e: CustomEvent<DndEvent<Item>>) => (items = e.detail.items)
  function finalize(e: CustomEvent<DndEvent<Item>>) {
    items = e.detail.items
    prefs.personaOrder = e.detail.items.map((i) => i.id as PersonaId)
  }
  function move(index: number, by: -1 | 1) {
    const next = [...prefs.personaOrder]
    ;[next[index], next[index + by]] = [next[index + by], next[index]]
    prefs.personaOrder = next
  }

  const preview = (palette: (typeof PALETTES)[number]): MediaSpec => ({ type: 'pixel-scene', version: 1, seed: 7, scene: 'mountain-lake', palette })
  const pretty = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  function reset() {
    if (confirm('Reset theme, reveal mode, persona order and palette to defaults?')) resetPrefs()
  }
</script>

<h1 class="mb-1 text-2xl font-bold">Settings</h1>
<p class="mb-5 text-sm text-muted">Preferences are stored in this browser only.</p>

<div class="space-y-5">
  <section class="card p-5" aria-labelledby="appearance-h">
    <h2 id="appearance-h" class="mb-3 font-semibold">Appearance</h2>
    <fieldset class="inline-flex rounded-xl bg-sunken p-1">
      <legend class="sr-only">Theme</legend>
      {#each themes as t (t.value)}
        <label class="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium has-checked:bg-surface has-checked:text-ink has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-accent text-muted">
          <input type="radio" name="theme" value={t.value} bind:group={prefs.theme} class="sr-only" />
          <Icon icon={t.icon} class="size-4" />{t.label}
        </label>
      {/each}
    </fieldset>
  </section>

  <section class="card p-5" aria-labelledby="order-h">
    <h2 id="order-h" class="font-semibold">Persona reply order</h2>
    <p class="mb-3 text-sm text-muted">Drag to reorder, or use the arrows. New debates ask personas to reply in this order.</p>
    <ol
      class="space-y-2"
      aria-labelledby="order-h"
      use:dndzone={{ items, flipDurationMs: flipMs, dropTargetStyle: {} }}
      onconsider={consider}
      onfinalize={finalize}
    >
      {#each items as item, i (item.id)}
        {@const p = PERSONAS[item.id as PersonaId]}
        <li animate:flip={{ duration: flipMs }} class="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
          {#if p}
            <Icon icon="tabler:grip-vertical" class="size-5 cursor-grab text-faint" />
            <span class="w-4 text-sm font-semibold text-muted tabular-nums">{i + 1}</span>
            <Avatar spec={p.avatar} type="persona" class="size-9" />
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-semibold">{p.name}</span>
              <span class="rounded-full px-2 py-0.5 text-[11px] font-medium {toneClass[p.tone]}">{p.tag}</span>
            </span>
            <button type="button" onclick={() => move(i, -1)} disabled={i === 0} aria-label="Move {p.name} up" class="grid size-8 place-items-center rounded-lg text-muted hover:bg-sunken disabled:opacity-30">
              <Icon icon="tabler:chevron-up" class="size-5" />
            </button>
            <button type="button" onclick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move {p.name} down" class="grid size-8 place-items-center rounded-lg text-muted hover:bg-sunken disabled:opacity-30">
              <Icon icon="tabler:chevron-down" class="size-5" />
            </button>
          {/if}
        </li>
      {/each}
    </ol>
  </section>

  <section class="card p-5" aria-labelledby="palette-h">
    <h2 id="palette-h" class="font-semibold">Procedural art palette</h2>
    <p class="mb-3 text-sm text-muted">Used when you attach pixel art to a post.</p>
    <fieldset class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <legend class="sr-only">Palette</legend>
      <label class="cursor-pointer rounded-xl border border-line p-2 text-sm has-checked:border-accent has-checked:bg-accent-soft has-focus-visible:outline-2 has-focus-visible:outline-accent">
        <input type="radio" name="palette" value="random" bind:group={prefs.palette} class="sr-only" />
        <span class="grid aspect-video place-items-center rounded-lg bg-sunken text-muted"><Icon icon="tabler:arrows-shuffle" class="size-6" /></span>
        <span class="mt-1.5 block font-medium">Random</span>
      </label>
      {#each PALETTES as p (p)}
        <label class="cursor-pointer rounded-xl border border-line p-2 text-sm has-checked:border-accent has-checked:bg-accent-soft has-focus-visible:outline-2 has-focus-visible:outline-accent">
          <input type="radio" name="palette" value={p} bind:group={prefs.palette} class="sr-only" />
          <span class="block overflow-hidden rounded-lg"><Media spec={preview(p)} alt="" class="w-full" /></span>
          <span class="mt-1.5 block font-medium">{pretty(p)}</span>
        </label>
      {/each}
    </fieldset>
  </section>

  <section class="card flex items-center gap-4 p-5" aria-labelledby="reveal-h">
    <div class="flex-1">
      <h2 id="reveal-h" class="font-semibold">Reveal the Network</h2>
      <p class="text-sm text-muted">Label AI and human accounts, show provenance on generated replies, and map how threads spread.</p>
    </div>
    <RevealToggle />
  </section>

  <section class="card p-5" aria-labelledby="about-h">
    <h2 id="about-h" class="mb-2 font-semibold">About this simulation</h2>
    <div class="space-y-2 text-sm leading-relaxed text-muted">
      <p>Deadnet is a simulation inspired by the Dead Internet Theory: the idea that much of what we read online is produced by bots rather than people.</p>
      <p>Everything here except your own posts is synthetic. The four personas are AI characters that reply to your opinions (or sample responses when no live model is configured), and the synthetic accounts post procedural pixel art and scripted text.</p>
      <p>Statistics and trending topics describe this demo instance only. Nothing here detects or measures bots on the real internet.</p>
    </div>
  </section>

  <section class="card flex items-center gap-4 p-5" aria-labelledby="reset-h">
    <div class="flex-1">
      <h2 id="reset-h" class="font-semibold">Reset preferences</h2>
      <p class="text-sm text-muted">Restore the default theme, reveal mode, persona order and palette.</p>
    </div>
    <button type="button" onclick={reset} class="rounded-xl border border-line px-4 py-2 text-sm font-medium text-danger hover:bg-danger-soft">Reset</button>
  </section>
</div>
