// Harmless per-browser preferences (theme, reveal toggle, persona order, art palette).
import { PALETTES, PERSONA_IDS, type PersonaId } from '../../shared/contract'

type Theme = 'system' | 'light' | 'dark'
type Palette = (typeof PALETTES)[number]
interface Prefs { theme: Theme; reveal: boolean; personaOrder: PersonaId[]; palette: Palette | 'random' }

const KEY = 'deadnet:prefs'
const defaults: Prefs = { theme: 'system', reveal: true, personaOrder: [...PERSONA_IDS], palette: 'random' }

function load(): Prefs {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    const order = Array.isArray(saved.personaOrder) && saved.personaOrder.length === 4 &&
      PERSONA_IDS.every((id) => saved.personaOrder.includes(id)) ? saved.personaOrder : defaults.personaOrder
    return { ...defaults, ...saved, personaOrder: order }
  } catch {
    return { ...defaults }
  }
}

export const prefs: Prefs = $state(load())

export function applyTheme() {
  const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

// Persist + apply whenever prefs change (call once from the root component).
export function syncPrefs() {
  $effect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)) } catch { /* storage unavailable */ }
    applyTheme()
  })
}

export function resetPrefs() {
  Object.assign(prefs, { ...defaults, personaOrder: [...PERSONA_IDS] })
}
