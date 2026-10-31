// Bundles only the Tabler icons referenced in src/ so Iconify renders offline without the full set.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { getIcons } from '@iconify/utils'

const tabler = JSON.parse(readFileSync('node_modules/@iconify-json/tabler/icons.json', 'utf8'))
const names = new Set()
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(svelte|ts)$/.test(f)) for (const m of readFileSync(p, 'utf8').matchAll(/tabler:([a-z0-9-]+)/g)) names.add(m[1])
  }
}
walk('src')
const subset = getIcons(tabler, [...names].sort())
const missing = [...names].filter((n) => !subset?.icons[n] && !subset?.aliases?.[n])
if (missing.length) throw new Error(`Unknown tabler icons: ${missing.join(', ')}`)
writeFileSync('src/lib/icons.json', JSON.stringify(subset) + '\n')
console.log(`icons.json: ${names.size} icons`)
