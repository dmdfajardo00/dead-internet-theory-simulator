<script lang="ts" module>
  import type { Route } from '../router.svelte'

  export const NAV = [
    { name: 'home', label: 'Home', href: '#/', icon: 'tabler:home', active: 'tabler:home-filled' },
    { name: 'explore', label: 'Explore', href: '#/explore', icon: 'tabler:search', active: 'tabler:search' },
    { name: 'saved', label: 'Saved', href: '#/saved', icon: 'tabler:bookmark', active: 'tabler:bookmark-filled' },
    { name: 'settings', label: 'Settings', href: '#/settings', icon: 'tabler:settings', active: 'tabler:settings-filled' },
  ] as const

  export const ORB_STYLE =
    'background: radial-gradient(circle at 50% 50%, #fff 0 18%, #c9b8ff 30%, #8b6cf7 58%, #6a4be8 78%, #e9e2ff 100%); box-shadow: 0 6px 18px rgb(122 90 245 / 0.35);'

  export const isActive = (item: (typeof NAV)[number], route: Route) =>
    item.name === route.name || (item.name === 'home' && route.name === 'post')
</script>

<script lang="ts">
  import Icon from '@iconify/svelte'
  import { router } from '../router.svelte'
  import RevealToggle from './RevealToggle.svelte'
</script>

{#snippet orb(size: string)}
  <span
    aria-hidden="true"
    class="block shrink-0 rounded-full {size}"
    style={ORB_STYLE}
  ></span>
{/snippet}

<div class="sticky top-0 flex h-dvh flex-col gap-8 px-3 py-6 xl:px-4">
  <a href="#/" class="flex items-center gap-3 rounded-xl px-1 xl:px-2" aria-label="Deadnet home">
    {@render orb('size-10')}
    <span class="hidden min-w-0 xl:block">
      <span class="flex items-center gap-2">
        <span class="text-2xl font-bold tracking-tight">Deadnet</span>
        <span class="rounded-full bg-sunken px-2 py-0.5 text-xs font-medium text-muted">v0.3</span>
      </span>
      <span class="block text-[13px] text-muted">The Dead Internet Theory Simulator</span>
    </span>
  </a>

  <nav aria-label="Main">
    <ul class="flex flex-col gap-1">
      {#each NAV as item (item.name)}
        {@const active = isActive(item, router.route)}
        <li>
          <a
            href={item.href}
            aria-current={active ? 'page' : undefined}
            title={item.label}
            class="relative flex items-center justify-center gap-4 rounded-xl px-3 py-3 text-lg transition-colors motion-reduce:transition-none xl:justify-start xl:px-4
              {active ? 'bg-accent-soft font-semibold text-ink' : 'text-ink/80 hover:bg-sunken'}"
          >
            {#if active}<span aria-hidden="true" class="absolute inset-y-1 left-0 w-1 rounded-full bg-accent"></span>{/if}
            <Icon icon={active ? item.active : item.icon} class="size-6 {active ? 'text-ink' : ''}" />
            <span class="hidden xl:inline">{item.label}</span>
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  <div class="mt-auto hidden xl:block">
    <section class="card p-4" aria-labelledby="reveal-title">
      <svg viewBox="0 0 240 110" class="mx-auto mb-2 h-24 w-full text-accent" aria-hidden="true">
        {#each [12, 24, 36, 48] as r (r)}
          <circle cx="120" cy="55" {r} fill="none" stroke="currentColor" stroke-opacity={0.55 - r / 120} stroke-width="1" />
        {/each}
        <circle cx="120" cy="55" r="6" fill="currentColor" />
        {#each [[40, 30], [62, 70], [80, 22], [168, 26], [186, 64], [204, 40], [28, 60], [150, 92], [96, 94], [214, 84]] as [x, y] (`${x}-${y}`)}
          <circle cx={x} cy={y} r="1.5" fill="currentColor" fill-opacity="0.45" />
        {/each}
      </svg>
      <div class="flex items-center gap-2">
        <h2 id="reveal-title" class="font-semibold">Reveal the Network</h2>
        <span class="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">BETA</span>
      </div>
      <div class="mt-2 flex items-center gap-3">
        <p class="text-sm text-muted">Show which accounts are AI and explore how conversations spread.</p>
        <RevealToggle />
      </div>
    </section>
  </div>
  <div class="mt-auto flex justify-center xl:hidden" title="Reveal the Network">
    <RevealToggle />
  </div>
</div>
