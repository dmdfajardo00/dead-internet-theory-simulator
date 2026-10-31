// Canvas painter for composed pixel art. The canvas stays at low resolution and
// is upscaled by CSS (.pixelated = nearest neighbour), so we draw once per spec.
import { colorsOf, type Composed, type DrawOp } from './engine'

const cache = new Map<string, ImageData>()

function draw(ctx: CanvasRenderingContext2D, op: DrawOp) {
  if (op.k === 'group') {
    ctx.save()
    ctx.translate(op.x, op.y)
    ctx.scale(op.s, op.s)
    for (const child of op.ops) draw(ctx, child)
    ctx.restore()
    return
  }
  ctx.fillStyle = op.c
  switch (op.k) {
    case 'rect': ctx.fillRect(op.x, op.y, op.w, op.h); break
    case 'ellipse': ctx.beginPath(); ctx.ellipse(op.x, op.y, op.rx, op.ry, 0, 0, Math.PI * 2); ctx.fill(); break
    case 'poly': {
      ctx.beginPath()
      for (let i = 0; i < op.p.length; i += 2) ctx.lineTo(op.p[i], op.p[i + 1])
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'path': {
      const p = new Path2D(op.d)
      if (op.stroke) {
        ctx.strokeStyle = op.c
        ctx.lineWidth = op.stroke
        ctx.lineCap = ctx.lineJoin = 'round'
        ctx.stroke(p)
      } else ctx.fill(p)
      break
    }
    case 'dither':
      for (let y = op.y; y < op.y + op.h; y++)
        for (let x = op.x + ((y - op.y) % 2); x < op.x + op.w; x += 2) ctx.fillRect(x, y, 1, 1)
      break
  }
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

/** Snap every pixel to the nearest colour actually used: crisp, antialias-free palette art. */
function quantize(img: ImageData, colors: string[]) {
  const pal = colors.map(rgb)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    let best = pal[0], bestDist = Infinity
    for (const c of pal) {
      const dr = d[i] - c[0], dg = d[i + 1] - c[1], db = d[i + 2] - c[2]
      const dist = 2 * dr * dr + 4 * dg * dg + 3 * db * db
      if (dist < bestDist) { bestDist = dist; best = c }
    }
    d[i] = best[0]; d[i + 1] = best[1]; d[i + 2] = best[2]; d[i + 3] = 255
  }
}

export function paint(canvas: HTMLCanvasElement, composed: Composed, key: string) {
  canvas.width = composed.width
  canvas.height = composed.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  let img = cache.get(key)
  if (!img) {
    for (const op of composed.ops) draw(ctx, op)
    img = ctx.getImageData(0, 0, composed.width, composed.height)
    quantize(img, [...colorsOf(composed.ops)])
    if (cache.size > 300) cache.clear()
    cache.set(key, img)
  }
  ctx.putImageData(img, 0, 0)
}
