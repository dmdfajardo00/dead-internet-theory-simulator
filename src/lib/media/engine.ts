// Deterministic procedural media engine (pure, DOM-free).
// render(seed, subject, scene, palette, version) -> identical DrawOps every time.
// All variation comes from a seeded PRNG; never Math.random(). Only arithmetic is
// used (no Math.sin/pow) so output is bit-identical across JS engines.
// All subject and scene shapes below are original work for this project.
import {
  GRAPHIC_VARIANTS, PALETTES as PALETTE_NAMES, SCENES, SUBJECTS, type MediaSpec,
} from '../../../shared/contract'

export type PaletteName = (typeof PALETTE_NAMES)[number]
export type Subject = (typeof SUBJECTS)[number]
export type Scene = (typeof SCENES)[number]
export type PixelSpec = Extract<MediaSpec, { type: 'pixel-scene' | 'pixel-icon' }>
export type GraphicSpec = Extract<MediaSpec, { type: 'graphic' }>

/** Serializable draw instructions in low-res pixel coordinates. */
export type DrawOp =
  | { k: 'rect'; x: number; y: number; w: number; h: number; c: string }
  | { k: 'ellipse'; x: number; y: number; rx: number; ry: number; c: string }
  | { k: 'poly'; p: number[]; c: string }
  /** SVG path data; filled, or stroked with round caps when `stroke` is set */
  | { k: 'path'; d: string; c: string; stroke?: number }
  /** checkerboard of `c` over the area (pixel-art gradient transition) */
  | { k: 'dither'; x: number; y: number; w: number; h: number; c: string }
  /** children drawn translated by (x, y) and scaled by s */
  | { k: 'group'; x: number; y: number; s: number; ops: DrawOp[] }

export interface Composed { width: number; height: number; ops: DrawOp[] }

// ---------- PRNG ----------
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a 32-bit string hash; also handy for deriving a seed from text. */
export function hashString(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  return h >>> 0
}

function rng(seed: number) {
  const next = mulberry32(seed)
  return {
    next,
    range: (a: number, b: number) => a + (b - a) * next(),
    int: (a: number, b: number) => a + Math.floor((b - a + 1) * next()),
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    chance: (p: number) => next() < p,
  }
}
type Rng = ReturnType<typeof rng>

// ---------- palettes ----------
export interface Palette {
  /** sky gradient, top -> horizon */
  sky: readonly [string, string, string, string]
  sun: string
  far: string
  mid: string
  near: string
  water: string
  accent: string
  light: string
  dark: string
  /** soft avatar background */
  bg: string
  night: boolean
}

export const PALETTES: Record<PaletteName, Palette> = {
  'lavender-dusk': {
    sky: ['#4a3a8c', '#8458b8', '#dd7aa6', '#f7ad7a'], sun: '#ffe7a8', far: '#7059a6', mid: '#47396f',
    near: '#2b2147', water: '#6a4f9e', accent: '#f0854f', light: '#ffc96e', dark: '#1c1530', bg: '#e6ddff', night: false,
  },
  'mint-morning': {
    sky: ['#6fcfc8', '#a6e5d8', '#dcf4e2', '#fff1c9'], sun: '#fffbea', far: '#86c5b4', mid: '#4c9c87',
    near: '#2a5f57', water: '#5fb3a8', accent: '#2fc495', light: '#fff0a0', dark: '#163634', bg: '#d4f4e7', night: false,
  },
  ember: {
    sky: ['#3d1426', '#8c2b30', '#d8552c', '#f6a63c'], sun: '#ffe38c', far: '#a63c36', mid: '#61202b',
    near: '#2c1018', water: '#7a2a30', accent: '#ff6b3d', light: '#ffc65a', dark: '#1a0910', bg: '#ffd9cc', night: false,
  },
  midnight: {
    sky: ['#0a0f2e', '#16214f', '#273b7a', '#3e5ba0'], sun: '#eef0ff', far: '#202d5e', mid: '#141b3e',
    near: '#090c20', water: '#1a2658', accent: '#6fa8ff', light: '#ffd56b', dark: '#05071a', bg: '#d3dbff', night: true,
  },
  pastel: {
    sky: ['#9fc0ff', '#cfc3ff', '#ffcde4', '#ffe7cf'], sun: '#fff8e6', far: '#b6a6e6', mid: '#8a82c6',
    near: '#5a5592', water: '#a9b7f0', accent: '#ff8bb0', light: '#fff0a6', dark: '#2e2a55', bg: '#ffe2ee', night: false,
  },
}

/** Fixed colours subjects may use regardless of palette (skin, fur, foliage...). */
export const INKS = {
  white: '#f8f4ec', black: '#1d1828', gray: '#8a8ea6', silver: '#cfd2de',
  skin1: '#f7d5b8', skin2: '#e3ab83', skin3: '#b67953', skin4: '#7a4a32',
  hair1: '#2a1d17', hair2: '#6c3f22', hair3: '#d8ae5f', hair4: '#b4542a',
  red: '#d9363b', redDark: '#86192a', pink: '#f39cb2', orange: '#ec9440',
  yellow: '#f5c64f', yellowDark: '#cf8f28', leaf: '#46a350', leafDark: '#25673b',
  leafLight: '#8fd06a', pot: '#cc6a3d', potDark: '#8c3e24', coffee: '#6b3e22',
  screen: '#151627', green: '#5ce27e', blue: '#3b5ad6',
} as const
const I = INKS

/** Every colour a spec may legally produce (palette roles + inks). */
export function allowedColors(palette: PaletteName): Set<string> {
  const p = PALETTES[palette]
  return new Set([...p.sky, p.sun, p.far, p.mid, p.near, p.water, p.accent, p.light, p.dark, p.bg, ...Object.values(I)])
}

/** Distinct colours used by a composition (the quantization target). */
export function colorsOf(ops: DrawOp[], out = new Set<string>()): Set<string> {
  for (const op of ops) op.k === 'group' ? colorsOf(op.ops, out) : out.add(op.c)
  return out
}

// ---------- primitives ----------
const R = (x: number, y: number, w: number, h: number, c: string): DrawOp => ({ k: 'rect', x, y, w, h, c })
const E = (x: number, y: number, rx: number, ry: number, c: string): DrawOp => ({ k: 'ellipse', x, y, rx, ry, c })
const poly = (c: string, ...p: number[]): DrawOp => ({ k: 'poly', p, c })
const path = (d: string, c: string, stroke?: number): DrawOp => (stroke ? { k: 'path', d, c, stroke } : { k: 'path', d, c })
const group = (x: number, y: number, s: number, ops: DrawOp[]): DrawOp => ({ k: 'group', x, y, s, ops })
const round = Math.round

// ---------- subjects (24x24 grid) ----------
type SubjectFn = (r: Rng, p: Palette) => DrawOp[]

const SUBJECT_ART: Record<Subject, SubjectFn> = {
  coffee(r, p) {
    const mug = r.pick([I.white, I.white, p.accent])
    const band = mug === I.white ? p.accent : I.white
    const ops: DrawOp[] = []
    const steam = r.int(2, 3)
    for (let i = 0; i < steam; i++) {
      const x = steam === 3 ? 6.5 + i * 3 : 8 + i * 3
      ops.push(path(`M${x} 8c-1.6-1.4 1.6-2.4 0-4.4`, I.silver, 1.2))
    }
    ops.push(
      E(10.5, 22, 9.5, 1.8, I.gray),
      path('M15.5 12.5h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-3', p.dark, 3.4),
      path('M15.5 12.5h3a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-3', mug, 1.4),
      path('M3 9h14v10a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3z', p.dark),
      path('M4 10h12v9a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2z', mug),
      R(4, 10, 12, 2, I.coffee),
      R(4, 15, 12, 2, band),
      R(5, 13, 1, 6, I.white === mug ? I.silver : I.white),
    )
    return ops
  },
  robot(r, p) {
    const body = r.pick([p.accent, p.water, I.silver])
    const eye = r.pick([p.light, I.green, I.white])
    return [
      R(11, 2.5, 2, 4, p.dark), E(12, 2.5, 2, 2, p.dark), E(12, 2.5, 1, 1, I.red),
      R(2, 10, 3, 7, p.dark), R(19, 10, 3, 7, p.dark),
      R(6, 19, 12, 2, p.dark), path('M2 24v-1a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v1z', p.dark), path('M3 24a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', body),
      path('M6 6h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-12a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3z', p.dark),
      path('M6 7h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z', body),
      R(5, 8, 1, 3, I.white),
      R(6, 9, 12, 6, p.dark), R(7.5, 10.5, 3, 3, eye), R(13.5, 10.5, 3, 3, eye), R(7.5, 10.5, 1, 1, I.white), R(13.5, 10.5, 1, 1, I.white),
      R(9, 16, 6, 2, p.dark), R(10, 16, 1, 1, eye), R(12, 16, 1, 1, eye), R(14, 16, 1, 1, eye),
    ]
  },
  cat(r, p) {
    const fur = r.pick([I.black, I.black, I.orange, I.gray])
    const outline = fur === I.black ? p.dark : I.black
    const eye = r.pick([I.yellow, I.green, p.light])
    return [
      poly(outline, 2.5, 13, 4, 1.5, 11.5, 6.5), poly(outline, 21.5, 13, 20, 1.5, 12.5, 6.5),
      E(12, 14.5, 10, 8, outline),
      poly(fur, 3.5, 12, 5, 3.5, 10.5, 7.5), poly(fur, 20.5, 12, 19, 3.5, 13.5, 7.5),
      poly(I.pink, 5.5, 9.5, 6, 5.5, 8.5, 8), poly(I.pink, 18.5, 9.5, 18, 5.5, 15.5, 8),
      E(12, 14.5, 9, 7, fur),
      E(12, 18.5, 5, 3.5, I.white), poly(I.white, 10, 15, 14, 15, 12, 11),
      E(8, 13.5, 2.5, 2.5, outline), E(16, 13.5, 2.5, 2.5, outline),
      E(8, 13.5, 1.8, 1.8, eye), E(16, 13.5, 1.8, 1.8, eye),
      R(7.5, 12, 1, 3, I.black), R(15.5, 12, 1, 3, I.black),
      poly(I.pink, 10.5, 16.5, 13.5, 16.5, 12, 18),
      R(11.5, 18, 1, 1.5, outline), R(10, 19.5, 1.5, 1, outline), R(12.5, 19.5, 1.5, 1, outline),
    ]
  },
  camera(r, p) {
    const body = r.pick([I.black, p.dark, p.mid])
    const trim = r.pick([I.silver, p.accent])
    return [
      path('M7 6h6l1 2H7z', body), R(15, 5.5, 3, 2.5, body),
      path('M5 8h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3z', body),
      R(2, 11, 20, 3, trim),
      E(12, 15, 6, 6, I.black), E(12, 15, 5, 5, I.silver), E(12, 15, 3.5, 3.5, I.screen), E(12, 15, 2, 2, I.blue),
      R(10, 13, 1.5, 1.5, I.white), R(17.5, 9, 2.5, 1.5, I.yellow), R(4, 9, 2, 1, I.gray),
    ]
  },
  folder(r, p) {
    const front = r.pick([I.yellow, I.yellow, p.accent])
    const back = front === I.yellow ? I.yellowDark : p.mid
    return [
      path('M2 6a1 1 0 0 1 1-1h6l2 2h10a1 1 0 0 1 1 1v13H2z', p.dark),
      path('M3 7a1 1 0 0 1 1-1h4.5l2 2H20a1 1 0 0 1 1 1v11H3z', back),
      R(5, 9, 14, 6, I.white), R(6, 10.5, 8, 1, I.silver), R(6, 12.5, 10, 1, I.silver),
      path('M1 11h22l-1.5 10.5H2.5z', p.dark),
      path('M2.2 12h19.6l-1.2 8.5H3.4z', front),
      R(3.5, 13, 17, 1, I.white),
    ]
  },
  terminal(r, p) {
    const fg = r.pick([I.green, p.accent, p.light])
    const ops: DrawOp[] = [
      path('M3 3h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', p.dark),
      R(2, 4, 20, 3, I.silver), R(3.5, 5, 1.5, 1.5, I.red), R(6, 5, 1.5, 1.5, I.yellow), R(8.5, 5, 1.5, 1.5, I.green),
      R(2, 7, 20, 13, I.screen),
      path('M4 9.5l2.5 2-2.5 2', fg, 1.2), R(8, 13, 3, 1.2, fg),
    ]
    for (let y = 15.5; y < 19; y += 2) ops.push(R(4, y, r.int(6, 14), 1, I.gray))
    return ops
  },
  plant(r, p) {
    const leaves: DrawOp[] = []
    // big leaves fanning out from the pot, alternating dark/light greens
    const fan = [
      'M12 15C8 14 4 10 3 5c4 1 8 4 9 10z', 'M12 15c4-1 8-5 9-10-4 1-8 4-9 10z',
      'M12 15C9 11 8 6 10 1c3 4 3 9 2 14z', 'M12 15c1-4 4-8 8-9-1 4-4 8-8 9z',
      'M12 15C8 13 5 13 2 15c3 2 7 2 10 0z', 'M12 15c4-2 7-2 10 0-3 2-7 2-10 0z',
    ]
    const tint = r.pick([I.leaf, I.leafLight])
    fan.forEach((d, i) => leaves.push(path(d, p.dark, 1.2)))
    fan.forEach((d, i) => leaves.push(path(d, i % 2 ? I.leafDark : i === 2 ? tint : I.leaf)))
    leaves.push(path('M12 15C9 11 7 8 5 6', I.leafDark, 0.8), path('M12 15c2-4 5-7 7-8', I.leafLight, 0.8))
    const pot = r.pick([I.pot, I.pot, p.accent, I.white])
    return [
      ...leaves,
      path('M6 14h12v3H6z', p.dark), path('M7 16h10l-1.5 7h-7z', p.dark),
      R(6.5, 14.5, 11, 2, pot === I.white ? I.silver : pot),
      path('M7.6 16.5h8.8l-1.3 6h-6.2z', pot === I.white ? I.white : I.potDark), R(8, 17, 1, 4, pot === I.white ? I.silver : pot),
    ]
  },
  ghost(r, p) {
    const body = r.pick([I.white, I.white, I.silver])
    const d = 'M5 21V11a7 7 0 0 1 14 0v10l-2.3-2-2.4 2-2.3-2-2.3 2-2.4-2z'
    return [
      path(d, p.dark, 2), path(d, body), path('M7 11a5 5 0 0 1 4-4.9', I.white === body ? I.silver : I.white, 1.2),
      E(9.5, 12, 1.4, 2, I.black), E(14.5, 12, 1.4, 2, I.black), R(9, 11, 0.8, 0.8, I.white), R(14, 11, 0.8, 0.8, I.white),
      E(12, 16, 1.4, 1.2, I.black), E(7.5, 14.5, 1.2, 0.8, I.pink), E(16.5, 14.5, 1.2, 0.8, I.pink),
    ]
  },
  heart(r, p) {
    const fill = r.pick([I.red, p.accent, I.pink])
    const d = 'M12 21 3.8 12.6A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 8.2 6.2z'
    return [path(d, p.dark, 2.4), path(d, fill), R(6, 9, 2, 2, I.white), R(5, 11, 1, 1, I.white)]
  },
  moon(r, p) {
    const d = 'M14 2.5a9.5 9.5 0 1 0 7.5 15 7.5 7.5 0 1 1-7.5-15z'
    const ops: DrawOp[] = [path(d, p.dark, 2), path(d, I.yellow), E(8, 15, 1.5, 1.5, I.yellowDark), E(11, 19, 1, 1, I.yellowDark), E(6.5, 9.5, 1, 1, I.yellowDark)]
    for (let i = 0; i < 2; i++) {
      const x = r.int(15, 20), y = i ? r.int(9, 12) : r.int(3, 6)
      ops.push(R(x, y - 1, 1, 3, p.accent), R(x - 1, y, 3, 1, p.accent))
    }
    return ops
  },
  devil(_r, p) {
    const face = I.red
    return [
      poly(I.black, 2, 12, 2.5, 1, 9.5, 7.5), poly(I.black, 22, 12, 21.5, 1, 14.5, 7.5),
      poly(I.silver, 3.5, 9.5, 3.5, 3.5, 7.5, 7), poly(I.silver, 20.5, 9.5, 20.5, 3.5, 16.5, 7),
      E(12, 14.5, 9.5, 8.5, I.redDark), E(12, 14.5, 8.5, 7.5, face), E(9, 10.5, 3, 1.5, face === I.red ? I.pink : I.white),
      poly(I.black, 5.5, 10.5, 11, 13, 11, 14.5, 5.5, 12.5), poly(I.black, 18.5, 10.5, 13, 13, 13, 14.5, 18.5, 12.5),
      R(7, 13.5, 3, 2, I.yellow), R(14, 13.5, 3, 2, I.yellow), R(8.5, 13.5, 1, 2, I.black), R(14.5, 13.5, 1, 2, I.black),
      path('M7 17.5h10l-1.5 3h-7z', I.black), poly(I.white, 8.5, 17.5, 10, 17.5, 9.25, 19), poly(I.white, 14, 17.5, 15.5, 17.5, 14.75, 19),
      poly(I.black, 10.5, 22, 13.5, 22, 12, 24),
    ]
  },
  sage(r, p) {
    const skin = r.pick([I.skin1, I.skin2])
    const robe = r.pick([p.accent, p.water, p.mid])
    return [
      path('M1 24c0-3 3-5 7-5h8c4 0 7 2 7 5z', robe),
      E(12, 10.5, 7, 7.5, p.dark), E(12, 10.5, 6, 6.5, skin),
      E(5.5, 10, 2.5, 3.5, I.silver), E(18.5, 10, 2.5, 3.5, I.silver), E(5.5, 9.5, 1.8, 2.8, I.white), E(18.5, 9.5, 1.8, 2.8, I.white),
      path('M5 11c0 7 3 12 7 12.5 4-.5 7-5.5 7-12.5-1 3-3 4.5-4 4.5h-6c-1 0-3-1.5-4-4.5z', p.dark, 1.6),
      path('M5 11c0 7 3 12 7 12.5 4-.5 7-5.5 7-12.5-1 3-3 4.5-4 4.5h-6c-1 0-3-1.5-4-4.5z', I.silver),
      path('M6 12c0 6 2.5 10 6 10.5 3.5-.5 6-4.5 6-10.5-1 2.5-2.5 4-4 4h-4c-1.5 0-3-1.5-4-4z', I.white),
      path('M8 15.5c1.5-1.5 3-1.5 4-.5 1-1 2.5-1 4 .5-1.5.5-2.5 1-4 .5-1.5.5-2.5 0-4-.5z', I.silver),
      R(11.5, 12, 1, 2.5, skin === I.skin1 ? I.skin2 : I.skin3),
      R(7.5, 9, 3, 1.2, I.white), R(13.5, 9, 3, 1.2, I.white),
      R(8.5, 10.5, 1.5, 1.2, I.black), R(14, 10.5, 1.5, 1.2, I.black),
      R(8, 6, 8, 0.8, skin === I.skin1 ? I.skin2 : I.skin3),
    ]
  },
  person(r, p) {
    const skins = [I.skin1, I.skin2, I.skin3, I.skin4]
    const si = r.int(0, 3)
    const skin = skins[si], shade = skins[Math.min(3, si + 1)] === skin ? I.hair2 : skins[Math.min(3, si + 1)]
    const hair = r.pick([I.hair1, I.hair1, I.hair2, I.hair3, I.hair4, I.black])
    const shirt = r.pick([p.accent, p.water, p.mid, I.white, p.dark])
    const style = r.int(0, 3) // 0 short, 1 long, 2 bun, 3 buzz + beard
    const ops: DrawOp[] = []
    if (style === 1) ops.push(path('M5 11a7 7 0 0 1 14 0v9H5z', hair))
    ops.push(
      path('M2 24c0-4 4-6.5 10-6.5s10 2.5 10 6.5z', shirt), path('M9.5 17.5h5L12 21z', shade),
      R(10, 14, 4, 4, shade),
      E(12, 10.5, 5.5, 6.2, skin), E(6.6, 11, 1.1, 1.6, shade), E(17.4, 11, 1.1, 1.6, shade),
    )
    if (style === 0) ops.push(path('M6.2 10C6 5.5 8.5 3.8 12 3.8S18 5.5 17.8 10c-1.5-2-3-3-5.8-3s-5 1.5-5.8 3z', hair))
    if (style === 1) ops.push(path('M6.2 11C6 5.5 8.5 3.8 12 3.8S18 5.5 17.8 11c-1.5-3-5-4-5.8-4.5-1 1-4 1.5-5.8 4.5z', hair))
    if (style === 2) ops.push(E(12, 3.2, 2.8, 2.2, hair), path('M6.4 9.5C6.4 6 8.5 4.3 12 4.3s5.6 1.7 5.6 5.2C16 7.8 14 7 12 7S8 7.8 6.4 9.5z', hair))
    if (style === 3) ops.push(path('M6.5 8.5C7 5.5 9 4.3 12 4.3s5 1.2 5.5 4.2C16 7 14 6.6 12 6.6S8 7 6.5 8.5z', hair), path('M6.6 12c.4 4 2.6 6.6 5.4 6.6s5-2.6 5.4-6.6c-1 2-2 2.5-3 2.5h-4.8c-1 0-2-.5-3-2.5z', hair))
    ops.push(R(9, 10, 1.5, 1.5, I.black), R(13.5, 10, 1.5, 1.5, I.black), R(10.5, 14, 3, 1, style === 3 ? skin : shade))
    return ops
  },
}

// ---------- scene primitives (160x90) ----------
const W = 160, H = 90

function skyBands(r: Rng, p: Palette, horizon: number): DrawOp[] {
  const cuts = [0.3, 0.56, 0.8].map((f) => round(horizon * f + r.range(-2, 2)))
  return [
    R(0, 0, W, horizon, p.sky[3]),
    R(0, 0, W, cuts[0], p.sky[0]), R(0, cuts[0], W, cuts[1] - cuts[0], p.sky[1]), R(0, cuts[1], W, cuts[2] - cuts[1], p.sky[2]),
    ...cuts.map((y, i): DrawOp => ({ k: 'dither', x: 0, y, w: W, h: 2, c: p.sky[i] })),
  ]
}

function celestial(r: Rng, p: Palette, x: number, y: number, rad: number): DrawOp[] {
  if (p.night) {
    const ops: DrawOp[] = []
    for (let i = 0; i < 26; i++) ops.push(R(r.int(0, W - 1), r.int(0, 40), 1, 1, r.chance(0.3) ? p.light : p.sun))
    for (let i = 0; i < 3; i++) {
      const sx = r.int(6, W - 6), sy = r.int(4, 26)
      ops.push(R(sx - 1, sy, 3, 1, p.sun), R(sx, sy - 1, 1, 3, p.sun))
    }
    const my = Math.max(12, y - 18), mr = round(rad * 0.7)
    ops.push(E(x, my, mr + 3, mr + 3, p.sky[1]), E(x, my, mr, mr, p.sun), E(x + mr * 0.45, my - mr * 0.35, mr * 0.85, mr * 0.85, p.sky[1]))
    return ops
  }
  return [
    E(x, y, rad + 4, rad + 4, p.sky[3]), E(x, y, rad + 1.5, rad + 1.5, p.light), E(x, y, rad, rad, p.sun),
  ]
}

function clouds(r: Rng, p: Palette, n: number, maxY: number): DrawOp[] {
  const ops: DrawOp[] = []
  for (let i = 0; i < n; i++) {
    const x = r.int(0, W), y = r.int(8, maxY), w = r.int(8, 18)
    const c = y < maxY / 2 ? p.sky[1] : p.sky[2]
    ops.push(E(x, y, w, 2, c), E(x - w / 3, y - 1.5, w / 2, 2.5, c), E(x + w / 4, y - 2, w / 3, 2.5, c))
  }
  return ops
}

/** Midpoint-displacement ridgeline, normalised to [base - amp, base]. */
function ridge(r: Rng, base: number, amp: number, rough: number, c: string, rim?: string) {
  const n = 32
  const h = new Array<number>(n + 1).fill(0)
  h[0] = r.range(0, 1)
  h[n] = r.range(0, 1)
  for (let size = n, d = 1; size > 1; size /= 2, d *= rough)
    for (let i = size / 2; i < n; i += size) h[i] = (h[i - size / 2] + h[i + size / 2]) / 2 + r.range(-d, d)
  const lo = Math.min(...h), span = Math.max(...h) - lo || 1
  const ys = h.map((v) => round(base - ((v - lo) / span) * amp))
  const pts: number[] = [0, H]
  ys.forEach((y, i) => pts.push((i * W) / n, y))
  pts.push(W, H)
  const yAt = (x: number) => ys[Math.max(0, Math.min(n, round((x * n) / W)))]
  // optional 1px light rim along the crest: rim shape, then the body shifted down
  const op = rim ? group(0, 0, 1, [poly(rim, ...pts), poly(c, ...pts.map((v, i) => (i % 2 ? v + 1 : v)))]) : poly(c, ...pts)
  return { op, yAt, ys }
}

function pine(x: number, base: number, h: number, c: string): DrawOp {
  const w = h * 0.55
  return poly(c,
    x, base - h, x + w * 0.28, base - h * 0.62, x + w * 0.16, base - h * 0.62, x + w * 0.4, base - h * 0.3, x + w * 0.26, base - h * 0.3,
    x + w * 0.5, base, x - w * 0.5, base, x - w * 0.26, base - h * 0.3, x - w * 0.4, base - h * 0.3, x - w * 0.16, base - h * 0.62, x - w * 0.28, base - h * 0.62)
}

function skyline(r: Rng, base: number, minH: number, maxH: number, c: string, win: string, lit: number): DrawOp[] {
  const ops: DrawOp[] = []
  for (let x = -r.int(0, 5); x < W;) {
    const w = r.int(7, 15), h = r.int(minH, maxH), top = base - h
    ops.push(R(x, top, w, H - top, c))
    if (r.chance(0.3)) ops.push(R(x + 2, top - 2, w - 4, 2, c))
    if (r.chance(0.25)) ops.push(R(x + r.int(2, w - 3), top - r.int(4, 8), 1, 8, c))
    for (let wy = top + 2; wy < base - 2; wy += 3)
      for (let wx = x + 2; wx < x + w - 2; wx += 3) if (r.chance(lit)) ops.push(R(wx, wy, 2, 1, win))
    x += w - r.int(0, 2)
  }
  return ops
}

/** Horizontal shimmer stripes below a light source (water reflection). */
function reflection(r: Rng, x: number, y0: number, y1: number, maxW: number, c: string): DrawOp[] {
  const ops: DrawOp[] = []
  for (let y = y0, i = 0; y < y1; y += 2 + (i++ % 2)) {
    const w = Math.max(2, round(maxW * (1 - (y - y0) / (y1 - y0)) + r.range(-2, 2)))
    ops.push(R(round(x - w / 2 + r.range(-1.5, 1.5)), y, w, 1, c))
  }
  return ops
}

const FLOATERS: readonly Subject[] = ['ghost', 'heart', 'moon']

function placeSubject(r: Rng, p: Palette, subject: Subject | undefined, sunX: number, ground: number, s: number): DrawOp[] {
  if (!subject) return []
  const x = round(sunX > W / 2 ? r.range(10, 50) : r.range(W - 50 - 24 * s, W - 10 - 24 * s))
  const y = FLOATERS.includes(subject) ? r.int(6, 18) : round(ground - 23 * s)
  return [group(x, y, s, SUBJECT_ART[subject](r, p))]
}

type SceneFn = (r: Rng, p: Palette, subject: Subject | undefined) => DrawOp[]

const SCENE_ART: Record<Scene, SceneFn> = {
  'mountain-lake'(r, p, subject) {
    const horizon = 58
    const sx = r.int(28, 132), sy = r.int(22, 32), sr = r.int(7, 10)
    const far = ridge(r, 50, r.int(20, 28), 0.55, p.far, p.sky[2])
    const mid = ridge(r, 57, r.int(8, 13), 0.6, p.mid)
    const ops: DrawOp[] = [...skyBands(r, p, horizon), ...celestial(r, p, sx, sy, sr), ...clouds(r, p, r.int(1, 3), 30), far.op, mid.op]
    // lake: mirrored, squashed ridge with ripple lines cutting through it
    ops.push(R(0, horizon, W, H - horizon, p.water))
    const mirror: number[] = [0, horizon]
    mid.ys.forEach((y, i) => mirror.push((i * W) / 32, round(horizon + (horizon - y) * 0.6)))
    mirror.push(W, horizon)
    ops.push(poly(p.mid, ...mirror))
    for (let y = horizon + 2; y < H; y += 3) ops.push(R(r.int(-20, 40), y, r.int(30, 90), 1, p.water))
    if (!p.night) ops.push(...reflection(r, sx, horizon + 2, H - 6, sr * 2, p.light))
    for (let i = 0; i < 6; i++) ops.push(R(r.int(0, W - 10), r.int(horizon + 4, H - 2), r.int(4, 10), 1, p.sky[2]))
    // near shore with pines on one side, subject on the other
    const left = sx > W / 2
    const bank = ridge(r, 86, 5, 0.5, p.near)
    ops.push(bank.op)
    for (let i = 0; i < 6; i++) {
      const tx = left ? r.int(2, 40) : r.int(120, 158)
      ops.push(pine(tx, bank.yAt(tx) + 1, r.int(12, 26), p.near))
    }
    return [...ops, ...placeSubject(r, p, subject, sx, bank.yAt(left ? 120 : 40) + 1, 1.1)]
  },
  'forest-sunset'(r, p, subject) {
    const horizon = 66
    const sx = r.int(40, 120), sy = r.int(50, 58), sr = r.int(12, 16)
    const ops: DrawOp[] = [...skyBands(r, p, horizon), ...celestial(r, p, sx, sy, sr), ...clouds(r, p, r.int(2, 4), 40)]
    ops.push(ridge(r, 62, r.int(10, 16), 0.55, p.far, p.sky[3]).op)
    const forest = ridge(r, 72, 6, 0.5, p.mid)
    ops.push(forest.op)
    for (let x = -2; x < W + 4; x += r.int(4, 7)) ops.push(pine(x, forest.yAt(x) + 2, r.int(8, 16), p.mid))
    ops.push(R(0, 82, W, H - 82, p.near))
    for (const side of [0, 1]) {
      for (let i = 0; i < 3; i++) {
        const x = side ? r.int(W - 30, W + 4) : r.int(-4, 30)
        ops.push(pine(x, 84, r.int(28, 52), p.near))
      }
    }
    return [...ops, ...placeSubject(r, p, subject, sx, 85, 1.1)]
  },
  'city-skyline'(r, p, subject) {
    const horizon = 70
    const sx = r.int(28, 132), sy = r.int(42, 54), sr = r.int(9, 13)
    const ops: DrawOp[] = [...skyBands(r, p, horizon), ...celestial(r, p, sx, sy, sr), ...clouds(r, p, r.int(1, 3), 34)]
    ops.push(...skyline(r, 72, 14, 40, p.far, p.sky[3], p.night ? 0.2 : 0.08))
    ops.push(...skyline(r, 78, 8, 28, p.mid, p.light, p.night ? 0.45 : 0.22))
    ops.push(R(0, 78, W, H - 78, p.near))
    ops.push(...reflection(r, sx, 80, H - 1, sr * 2, p.night ? p.light : p.sun))
    for (let i = 0; i < 10; i++) ops.push(R(r.int(0, W - 4), r.int(80, H - 1), r.int(2, 5), 1, r.chance(0.5) ? p.light : p.mid))
    return [...ops, ...placeSubject(r, p, subject, sx, 86, 1.1)]
  },
  'cozy-window'(r, p, subject) {
    const horizon = 70
    const sx = r.int(104, 140), sy = r.int(38, 50), sr = r.int(10, 13)
    const ops: DrawOp[] = [...skyBands(r, p, horizon), ...celestial(r, p, sx, sy, sr), ...clouds(r, p, r.int(1, 3), 30)]
    ops.push(...skyline(r, 74, 16, 44, p.far, p.sky[3], p.night ? 0.2 : 0.06))
    ops.push(...skyline(r, 74, 6, 26, p.mid, p.light, p.night ? 0.4 : 0.18))
    // window frame, mullion and sill
    const mx = r.int(54, 62)
    ops.push(
      R(0, 0, W, 4, p.dark), R(0, 3, W, 1, p.near), R(mx, 0, 4, 72, p.dark), R(mx + 3, 4, 1, 68, p.near),
      R(0, 68, W, 3, p.far), R(0, 68, W, 1, p.sky[2]), R(0, 71, W, 5, p.mid), R(0, 76, W, H - 76, p.dark),
      { k: 'dither', x: 0, y: 76, w: W, h: 2, c: p.mid },
    )
    const sill = 70
    ops.push(group(r.int(-6, 2), round(sill - 23 * 2.5), 2.5, SUBJECT_ART.plant(r, p)))
    const main: Subject = subject && subject !== 'plant' ? subject : 'coffee'
    ops.push(group(r.int(mx + 6, mx + 22), round(sill - 23 * 1.5), 1.5, SUBJECT_ART[main](r, p)))
    return ops
  },
}

// ---------- public API ----------
/** Compose a pixel spec into low-res draw ops; null for unknown versions or non-pixel specs. */
export function compose(spec: MediaSpec): Composed | null {
  switch (spec.version) {
    case 1: {
      if (spec.type === 'graphic') return null
      const p = PALETTES[spec.palette]
      if (!p) return null
      if (spec.type === 'pixel-icon') {
        const art = SUBJECT_ART[spec.subject]
        if (!art) return null
        const r = rng(spec.seed ^ hashString(`icon:${spec.subject}`))
        return { width: 24, height: 24, ops: [R(0, 0, 24, 24, p.bg), ...art(r, p)] }
      }
      const scene = SCENE_ART[spec.scene]
      if (!scene || (spec.subject && !SUBJECT_ART[spec.subject])) return null
      const r = rng(spec.seed ^ hashString(`scene:${spec.scene}`))
      return { width: W, height: H, ops: scene(r, p, spec.subject) }
    }
    default:
      return null
  }
}

export interface GraphicModel {
  variant: GraphicSpec['variant']
  title: string
  text?: string
  palette: Palette
  /** chart values (spec.data or seeded), 0..1000 */
  values: number[]
  /** chart drawn as a line instead of bars */
  line: boolean
  /** terminal / body lines */
  lines: string[]
  /** seeded decorative shapes for the poster, in a 100x56 box */
  shapes: { x: number; y: number; r: number; c: string }[]
}

/** Seeded colours and layout for HTML/SVG graphics; null for unknown versions. */
export function graphic(spec: MediaSpec): GraphicModel | null {
  if (spec.version !== 1 || spec.type !== 'graphic' || !GRAPHIC_VARIANTS.includes(spec.variant)) return null
  const r = rng(spec.seed ^ hashString(`graphic:${spec.variant}`))
  const palette = PALETTES[r.pick(PALETTE_NAMES)]
  const values = spec.data?.length ? spec.data : Array.from({ length: r.int(5, 8) }, () => r.int(12, 100))
  const lines = (spec.text ?? '').split(/\n|(?<=[.!?])\s+/).map((l) => l.trim()).filter(Boolean)
  const shapes = Array.from({ length: 3 }, (_, i) => ({
    x: r.int(55, 100), y: r.int(-10, 60), r: r.int(10, 26) - i * 3, c: [palette.accent, palette.sky[2], palette.light][i],
  }))
  return { variant: spec.variant, title: spec.title, text: spec.text, palette, values, line: r.chance(0.4), lines, shapes }
}

const SCENE_LABEL: Record<Scene, string> = {
  'mountain-lake': 'mountain lake', 'forest-sunset': 'forest sunset', 'city-skyline': 'city skyline', 'cozy-window': 'cozy window view',
}

/** Human description for alt text and reveal labels. */
export function describe(spec: MediaSpec): string {
  if (spec.version !== 1) return 'Unsupported media version'
  switch (spec.type) {
    case 'pixel-icon': return `Pixel art avatar: ${spec.subject}`
    case 'pixel-scene': return `Procedural pixel art: ${spec.subject ? `${spec.subject}, ` : ''}${SCENE_LABEL[spec.scene] ?? spec.scene}`
    case 'graphic': return `${spec.variant[0].toUpperCase()}${spec.variant.slice(1)} graphic: ${spec.title}${spec.text ? ` — ${spec.text}` : ''}`
  }
}

/**
 * A valid random MediaSpec for the composer. pixel-scene/pixel-icon pick scene,
 * subject and palette from the seed; graphic makes a quote or poster from words.
 */
export function randomSpec(
  kind: MediaSpec['type'], seed: number, palette?: PaletteName, words?: { title: string; text?: string },
): MediaSpec {
  const s = seed >>> 0
  const r = rng(s ^ 0x9e3779b9)
  const pal = palette ?? r.pick(PALETTE_NAMES)
  if (kind === 'pixel-icon') return { type: 'pixel-icon', version: 1, seed: s, subject: r.pick(SUBJECTS), palette: pal }
  if (kind === 'pixel-scene') {
    const scene = r.pick(SCENES)
    const subject = scene === 'cozy-window' ? r.pick(['coffee', 'coffee', 'cat', 'robot', 'camera', 'terminal'] as const)
      : r.chance(0.35) ? r.pick(['ghost', 'cat', 'robot', 'heart', 'moon'] as const) : undefined
    return subject ? { type: 'pixel-scene', version: 1, seed: s, scene, subject, palette: pal } : { type: 'pixel-scene', version: 1, seed: s, scene, palette: pal }
  }
  const title = (words?.title ?? '').trim().slice(0, 80).trim() || 'Untitled'
  const text = words?.text?.trim().slice(0, 200).trim()
  return { type: 'graphic', version: 1, seed: s, variant: r.chance(0.5) ? 'quote' : 'poster', title, ...(text ? { text } : {}) }
}
