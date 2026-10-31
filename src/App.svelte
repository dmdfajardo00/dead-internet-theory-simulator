<script lang="ts">
  import Icon from '@iconify/svelte'
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  import RightRail from './lib/components/RightRail.svelte'
  import SearchBar from './lib/components/SearchBar.svelte'
  import Sidebar, { isActive, NAV, ORB_STYLE } from './lib/components/Sidebar.svelte'
  import Explore from './lib/pages/Explore.svelte'
  import Home from './lib/pages/Home.svelte'
  import Saved from './lib/pages/Saved.svelte'
  import Settings from './lib/pages/Settings.svelte'
  import Thread from './lib/pages/Thread.svelte'
  import { syncPrefs } from './lib/prefs.svelte'
  import { router } from './lib/router.svelte'

  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, retry: 1 } } })
  syncPrefs()
</script>

<QueryClientProvider client={queryClient}>
  <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2"
    onclick={(e) => { e.preventDefault(); document.getElementById('main')?.focus() }}>Skip to content</a>

  <div class="mx-auto grid min-h-dvh max-w-[1328px] grid-cols-1 md:grid-cols-[88px_minmax(0,640px)] md:justify-center md:gap-6 xl:grid-cols-[300px_640px_340px]">
    <aside class="hidden border-r border-line md:block" aria-label="Sidebar">
      <Sidebar />
    </aside>

    <div class="min-w-0 px-4 pb-24 md:px-0 md:pb-10">
      <header class="sticky top-0 z-10 -mx-4 flex items-center gap-3 bg-app/90 px-4 py-3 backdrop-blur md:mx-0 md:px-0 md:pt-6">
        <a href="#/" class="shrink-0 md:hidden" aria-label="Deadnet home">
          <span class="block size-9 rounded-full" style={ORB_STYLE}></span>
        </a>
        <SearchBar />
      </header>

      <main id="main" tabindex="-1" class="mt-2 outline-none">
        {#if router.route.name === 'explore'}
          <Explore />
        {:else if router.route.name === 'saved'}
          <Saved />
        {:else if router.route.name === 'settings'}
          <Settings />
        {:else if router.route.name === 'post'}
          {#key router.route.id}
            <Thread id={router.route.id} />
          {/key}
        {:else}
          <Home />
        {/if}
      </main>
    </div>

    <aside class="hidden xl:block" aria-label="Your debate and network insights">
      <RightRail />
    </aside>
  </div>

  <nav aria-label="Main" class="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
    <ul class="grid grid-cols-4">
      {#each NAV as item (item.name)}
        {@const active = isActive(item, router.route)}
        <li>
          <a href={item.href} aria-current={active ? 'page' : undefined} class="flex flex-col items-center gap-0.5 py-2 text-xs {active ? 'font-semibold text-accent' : 'text-muted'}">
            <Icon icon={active ? item.active : item.icon} class="size-6" />
            {item.label}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
</QueryClientProvider>
