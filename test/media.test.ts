import { describe, expect, it } from 'vitest'
import { MediaSpec, PALETTES, SCENES, SUBJECTS } from '../shared/contract'
import { allowedColors, colorsOf, compose, describe as describeSpec, graphic, randomSpec } from '../src/lib/media/engine'

const scene = (seed: number, extra: Partial<Extract<MediaSpec, { type: 'pixel-scene' }>> = {}): MediaSpec =>
  ({ type: 'pixel-scene', version: 1, seed, scene: 'cozy-window', subject: 'coffee', palette: 'lavender-dusk', ...extra })

describe('media engine', () => {
  it('is deterministic: same spec composes to identical ops', () => {
    for (const spec of [scene(42), { type: 'pixel-icon', version: 1, seed: 7, subject: 'person', palette: 'pastel' } as MediaSpec]) {
      const a = compose(spec), b = compose(structuredClone(spec))
      expect(a).not.toBeNull()
      expect(a).toEqual(b)
      expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    }
  })

  it('varies with seed inside the same template and palette', () => {
    for (const name of SCENES) {
      const a = compose(scene(1, { scene: name, subject: undefined }))!
      const b = compose(scene(2, { scene: name, subject: undefined }))!
      expect(JSON.stringify(a.ops)).not.toBe(JSON.stringify(b.ops))
      expect([a.width, a.height]).toEqual([b.width, b.height])
      expect(a.ops.slice(0, 4).map((o) => o.k)).toEqual(b.ops.slice(0, 4).map((o) => o.k))
    }
    for (const palette of PALETTES) {
      const allowed = allowedColors(palette)
      for (let seed = 0; seed < 20; seed++) {
        const c = compose(scene(seed * 7919, { palette, scene: SCENES[seed % 4], subject: SUBJECTS[seed % SUBJECTS.length] }))!
        for (const color of colorsOf(c.ops)) expect(allowed.has(color), `${palette} ${color}`).toBe(true)
      }
    }
  })

  it('composes every subject and scene', () => {
    for (const palette of PALETTES) {
      for (const subject of SUBJECTS) {
        const icon = compose({ type: 'pixel-icon', version: 1, seed: 3, subject, palette })!
        expect(icon.width).toBe(24)
        expect(icon.ops.length).toBeGreaterThan(1)
      }
      for (const name of SCENES) {
        const s = compose(scene(9, { scene: name, subject: undefined, palette }))!
        expect([s.width, s.height]).toEqual([160, 90])
        expect(s.ops.length).toBeGreaterThan(5)
      }
    }
  })

  it('returns null for unknown versions', () => {
    const v2 = { ...scene(1), version: 2 } as unknown as MediaSpec
    expect(compose(v2)).toBeNull()
    expect(graphic({ type: 'graphic', version: 3, seed: 1, variant: 'quote', title: 'x' } as unknown as MediaSpec)).toBeNull()
    expect(describeSpec(v2)).toBe('Unsupported media version')
  })

  it('randomSpec produces valid MediaSpecs', () => {
    for (let seed = 0; seed < 200; seed++) {
      for (const kind of ['pixel-scene', 'pixel-icon', 'graphic'] as const) {
        const spec = randomSpec(kind, seed * 2654435761, undefined, { title: `  Post ${seed} `.repeat(seed % 20), text: 'x'.repeat(seed) })
        expect(MediaSpec.safeParse(spec).success, JSON.stringify(spec)).toBe(true)
        expect(spec.type).toBe(kind)
        expect(describeSpec(spec).length).toBeGreaterThan(0)
      }
    }
    expect(randomSpec('pixel-scene', 5, 'ember')).toMatchObject({ palette: 'ember' })
    expect(randomSpec('graphic', 1, undefined, { title: 'Hi' })).toEqual(randomSpec('graphic', 1, undefined, { title: 'Hi' }))
  })

  it('graphic chart falls back to seeded data', () => {
    const g = graphic({ type: 'graphic', version: 1, seed: 4, variant: 'chart', title: 'Chart' })!
    expect(g.values.length).toBeGreaterThan(3)
    expect(graphic({ type: 'graphic', version: 1, seed: 4, variant: 'chart', title: 'Chart' })).toEqual(g)
  })
})
