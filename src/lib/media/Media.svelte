<script lang="ts">
  import type { MediaSpec } from '../../../shared/contract'
  import { compose, describe, graphic } from './engine'
  import { paint } from './paint'

  let { spec, class: cls = '', alt }: { spec: MediaSpec; class?: string; alt?: string } = $props()

  // Keyed by content so a new-but-equal spec object never recomposes or repaints.
  const key = $derived(JSON.stringify(spec))
  const parsed = $derived(JSON.parse(key) as MediaSpec)
  const pixel = $derived(compose(parsed))
  const g = $derived(pixel ? null : graphic(parsed))
  const label = $derived(alt ?? describe(parsed))
</script>

{#if pixel}
  {@const art = pixel}
  <div role="img" aria-label={label} class="relative block overflow-hidden {art.width === art.height ? 'aspect-square' : 'aspect-video'} {cls}">
    <canvas aria-hidden="true" class="pixelated absolute inset-0 block size-full" width={art.width} height={art.height} {@attach (c) => paint(c, art, key)}></canvas>
  </div>
{:else if g}
  {@const p = g.palette}
  {#if g.variant === 'quote'}
    <div role="img" aria-label={label} class="relative flex aspect-video flex-col justify-center gap-3 overflow-hidden p-6 {cls}" style:background={p.dark} style:color={p.bg}>
      <div aria-hidden="true" class="absolute inset-y-0 left-0 w-2" style:background={p.accent}></div>
      <span aria-hidden="true" class="font-serif text-6xl leading-none font-bold" style:color={p.accent}>&ldquo;</span>
      <p class="line-clamp-4 -mt-6 text-xl font-semibold text-balance">{g.text || g.title}</p>
      {#if g.text}<p class="text-sm opacity-75">— {g.title}</p>{/if}
    </div>
  {:else if g.variant === 'poster'}
    <div role="img" aria-label={label} class="relative flex aspect-video flex-col justify-end overflow-hidden p-6 {cls}" style:background={p.bg} style:color={p.dark}>
      <svg aria-hidden="true" class="absolute inset-0 size-full" viewBox="0 0 100 56" preserveAspectRatio="xMidYMid slice">
        {#each g.shapes as s}<circle cx={s.x} cy={s.y} r={s.r} fill={s.c} />{/each}
        <rect x="0" y="50" width="100" height="2" fill={p.sky[1]} /><rect x="0" y="53" width="100" height="3" fill={p.sky[0]} />
      </svg>
      <p class="relative line-clamp-3 max-w-[75%] text-3xl leading-tight font-black tracking-tight uppercase">{g.title}</p>
      {#if g.text}<p class="relative mt-2 mb-3 line-clamp-2 max-w-[70%] text-sm font-medium">{g.text}</p>{/if}
    </div>
  {:else if g.variant === 'chart'}
    {@const max = Math.max(1, ...g.values)}
    {@const step = 100 / g.values.length}
    <div role="img" aria-label={label} class="flex aspect-video flex-col gap-2 overflow-hidden p-5 {cls}" style:background={p.bg} style:color={p.dark}>
      <p class="line-clamp-1 font-bold">{g.title}</p>
      {#if g.text}<p class="-mt-1.5 line-clamp-1 text-xs opacity-70">{g.text}</p>{/if}
      <svg aria-hidden="true" class="min-h-0 w-full flex-1" viewBox="0 0 100 50" preserveAspectRatio="none">
        <line x1="0" y1="49.5" x2="100" y2="49.5" stroke={p.mid} stroke-width="1" vector-effect="non-scaling-stroke" />
        {#if g.line}
          <polyline fill="none" stroke={p.accent} stroke-width="3" stroke-linejoin="round" vector-effect="non-scaling-stroke"
            points={g.values.map((v, i) => `${i * step + step / 2},${48 - (v / max) * 44}`).join(' ')} />
        {:else}
          {#each g.values as v, i}
            <rect x={i * step + step * 0.18} y={49 - (v / max) * 45} width={step * 0.64} height={(v / max) * 45} rx="1" fill={i % 2 ? p.mid : p.accent} />
          {/each}
        {/if}
      </svg>
    </div>
  {:else}
    <div role="img" aria-label={label} class="overflow-hidden font-mono text-sm {cls}" style:background={p.dark} style:color={p.bg}>
      <div class="flex items-center gap-1.5 px-3 py-2" style:background={p.near}>
        <span class="size-2.5 rounded-full bg-[#ff5f57]"></span><span class="size-2.5 rounded-full bg-[#febc2e]"></span><span class="size-2.5 rounded-full bg-[#28c840]"></span>
        <span class="ml-2 truncate text-xs opacity-80">{g.title}</span>
      </div>
      <div class="space-y-1 px-4 py-3">
        {#each g.lines.length ? g.lines : ['ready.'] as line, i}
          <p class="break-words"><span style:color={i === 0 ? p.accent : p.light}>{i === 0 ? '$' : '>'}</span> {line}</p>
        {/each}
        <p><span style:color={p.accent}>$</span> <span class="inline-block h-4 w-2 translate-y-0.5 animate-pulse motion-reduce:animate-none" style:background={p.bg}></span></p>
      </div>
    </div>
  {/if}
{:else}
  <div role="img" aria-label={alt ?? 'Unsupported media version'} class="grid aspect-video place-items-center bg-sunken p-4 text-center text-sm text-muted {cls}">
    Unsupported media version
  </div>
{/if}
