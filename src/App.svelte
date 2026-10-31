<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, retry: 1 } } })
</script>

<QueryClientProvider client={queryClient}>
  <main class="p-8">Deadnet</main>
</QueryClientProvider>
