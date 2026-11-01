import { useEffect, useRef } from 'react'
import { H, HOLE_R, W, moverPos, type Course, type Rect } from '../lib/courses'

const R = 7 // ball radius
const FRICTION = 0.982 // velocity kept per 60fps frame
const MAX_PULL = 120 // drag distance for a full-power putt
const MAX_SPEED = 15
const SINK_SPEED = 5.5 // faster than this and the ball skips over the cup

interface Props {
  course: Course
  onStroke: (n: number) => void
  onSink: (strokes: number) => void
}

/** One hole of mini golf on the given course. Drag back from anywhere, let go to putt. */
export function Golf({ course, onStroke, onSink }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  // keep the latest callbacks without restarting the game loop
  const cb = useRef({ onStroke, onSink })
  useEffect(() => {
    cb.current = { onStroke, onSink }
  }, [onStroke, onSink])

  useEffect(() => {
    const el = canvas.current
    const ctx = el?.getContext('2d')
    if (!el || !ctx) return
    const { walls: WALLS, movers: MOVERS } = course
    const TEE = course.tee
    const HOLE = { ...course.hole, r: HOLE_R }

    const ball = { x: TEE.x, y: TEE.y, vx: 0, vy: 0 }
    const trail: { x: number; y: number }[] = []
    let strokes = 0
    let sinking = -1 // seconds since the ball dropped, or -1
    let aim: { sx: number; sy: number; x: number; y: number } | null = null
    let t = 0
    let last = performance.now()
    let raf = 0
    let scale = 1

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = el.clientWidth
      el.width = w * dpr
      el.height = (w * H) / W * dpr
      scale = (w / W) * dpr
    }

    const speed = () => Math.hypot(ball.vx, ball.vy)
    const moving = () => speed() > 0

    /** Push the ball out of a rectangle and bounce it off the face it hit. */
    const collide = (r: Rect, push = { vx: 0, vy: 0 }) => {
      const cx = Math.max(r.x, Math.min(ball.x, r.x + r.w))
      const cy = Math.max(r.y, Math.min(ball.y, r.y + r.h))
      let dx = ball.x - cx
      let dy = ball.y - cy
      let d = Math.hypot(dx, dy)
      if (d >= R) return
      if (d === 0) {
        // centre ended up inside: leave through the nearest edge
        const exits = [ball.x - r.x, r.x + r.w - ball.x, ball.y - r.y, r.y + r.h - ball.y]
        const i = exits.indexOf(Math.min(...exits))
        dx = [-1, 1, 0, 0][i]
        dy = [0, 0, -1, 1][i]
        d = 1
      }
      const nx = dx / d
      const ny = dy / d
      ball.x = cx + nx * R
      ball.y = cy + ny * R
      const dot = (ball.vx - push.vx) * nx + (ball.vy - push.vy) * ny
      if (dot < 0) {
        ball.vx -= 1.75 * dot * nx
        ball.vy -= 1.75 * dot * ny
      }
    }

    const physics = (dt: number) => {
      if (sinking >= 0) {
        sinking += dt / 60
        return
      }
      const movers = MOVERS.map((m) => {
        const now = moverPos(m, t)
        const prev = moverPos(m, t - dt / 60)
        return { rect: now, push: { vx: (now.x - prev.x) / dt, vy: (now.y - prev.y) / dt } }
      })

      // movers can shove a resting ball, so always check them
      movers.forEach((m) => collide(m.rect, m.push))

      if (!moving()) return
      const subs = Math.min(10, Math.ceil((speed() * dt) / 3))
      for (let i = 0; i < subs; i++) {
        ball.x += (ball.vx * dt) / subs
        ball.y += (ball.vy * dt) / subs
        // course edges: lose a quarter of the speed on each bounce
        if (ball.x < R || ball.x > W - R) {
          ball.x = Math.max(R, Math.min(W - R, ball.x))
          ball.vx *= -0.75
        }
        if (ball.y < R || ball.y > H - R) {
          ball.y = Math.max(R, Math.min(H - R, ball.y))
          ball.vy *= -0.75
        }
        WALLS.forEach((w) => collide(w))
        movers.forEach((m) => collide(m.rect))
      }

      const f = Math.pow(FRICTION, dt)
      ball.vx *= f
      ball.vy *= f

      const dx = HOLE.x - ball.x
      const dy = HOLE.y - ball.y
      const d = Math.hypot(dx, dy)
      if (d < HOLE.r) {
        if (speed() < SINK_SPEED) {
          sinking = 0
          ball.vx = ball.vy = 0
          cb.current.onSink(strokes)
          return
        }
        // too hot: the cup tugs it a little as it rattles over
        ball.vx += (dx / d) * 0.35 * dt
        ball.vy += (dy / d) * 0.35 * dt
      } else if (d < HOLE.r * 2 && speed() < 2.5) {
        // gentle funnel so near-misses at crawling speed still drop
        ball.vx += (dx / d) * 0.06 * dt
        ball.vy += (dy / d) * 0.06 * dt
      }
      if (speed() < 0.06) ball.vx = ball.vy = 0
    }

    const draw = () => {
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      ctx.clearRect(0, 0, W, H)

      // turf: the same graph-paper grid as the site
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = 30; x < W; x += 30) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
      }
      for (let y = 30; y < H; y += 30) {
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
      }
      ctx.stroke()

      // tee box
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.setLineDash([4, 4])
      ctx.strokeRect(TEE.x - 18, TEE.y - 18, 36, 36)
      ctx.setLineDash([])

      // walls (solid) and movers (hatched, so they read as "the moving ones")
      ctx.fillStyle = '#fff'
      WALLS.forEach((w) => ctx.fillRect(w.x, w.y, w.w, w.h))
      ctx.strokeStyle = '#fff'
      for (const m of MOVERS) {
        const r = moverPos(m, t)
        ctx.lineWidth = 2
        ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2)
        ctx.save()
        ctx.beginPath()
        ctx.rect(r.x, r.y, r.w, r.h)
        ctx.clip()
        ctx.lineWidth = 1.5
        ctx.beginPath()
        for (let k = -r.h; k < r.w + r.h; k += 8) {
          ctx.moveTo(r.x + k, r.y + r.h)
          ctx.lineTo(r.x + k + r.h, r.y)
        }
        ctx.stroke()
        ctx.restore()
      }

      // cup + flag
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(HOLE.x, HOLE.y, HOLE.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#0b0b0b'
      ctx.beginPath()
      ctx.arc(HOLE.x, HOLE.y, HOLE.r - 3, 0, Math.PI * 2)
      ctx.fill()
      const wave = Math.sin(t * 5) * 4
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(HOLE.x, HOLE.y)
      ctx.lineTo(HOLE.x, HOLE.y - 52)
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.moveTo(HOLE.x, HOLE.y - 52)
      ctx.lineTo(HOLE.x + 26, HOLE.y - 45 + wave / 2)
      ctx.lineTo(HOLE.x, HOLE.y - 38)
      ctx.fill()

      // aim: rubber band back to the finger, dotted line forward showing power
      if (aim && sinking < 0) {
        const px = aim.sx - aim.x
        const py = aim.sy - aim.y
        const pull = Math.min(MAX_PULL, Math.hypot(px, py))
        if (pull > 4) {
          const nx = px / Math.hypot(px, py)
          const ny = py / Math.hypot(px, py)
          ctx.strokeStyle = 'rgba(255,255,255,0.3)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(ball.x, ball.y)
          ctx.lineTo(ball.x - nx * pull, ball.y - ny * pull)
          ctx.stroke()
          ctx.fillStyle = '#fff'
          const dots = Math.round((pull / MAX_PULL) * 9)
          for (let k = 1; k <= dots; k++) {
            ctx.beginPath()
            ctx.arc(ball.x + nx * (R + k * 12), ball.y + ny * (R + k * 12), 1.5 + k * 0.25, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      // ball + a short motion trail
      if (moving()) trail.unshift({ x: ball.x, y: ball.y })
      else trail.length = 0
      if (trail.length > 8) trail.length = 8
      trail.forEach((p, i) => {
        ctx.fillStyle = `rgba(255,255,255,${0.25 * (1 - i / 8)})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, R * (1 - i / 10), 0, Math.PI * 2)
        ctx.fill()
      })
      const r = sinking >= 0 ? R * Math.max(0, 1 - sinking * 4) : R
      if (r > 0) {
        const bx = sinking >= 0 ? HOLE.x : ball.x
        const by = sinking >= 0 ? HOLE.y : ball.y
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(bx, by, r, 0, Math.PI * 2)
        ctx.fill()
      }
      // idle hint: a pulsing ring around a resting ball
      if (!moving() && !aim && sinking < 0) {
        const pulse = (t * 1.2) % 1
        ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - pulse)})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, R + 4 + pulse * 14, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    const loop = (now: number) => {
      const dt = Math.min(3, (now - last) / (1000 / 60))
      last = now
      t += dt / 60
      physics(dt)
      draw()
      raf = requestAnimationFrame(loop)
    }

    const toCourse = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      return { x: ((e.clientX - rect.left) * W) / rect.width, y: ((e.clientY - rect.top) * H) / rect.height }
    }
    const down = (e: PointerEvent) => {
      if (moving() || sinking >= 0) return
      el.setPointerCapture(e.pointerId)
      const p = toCourse(e)
      aim = { sx: p.x, sy: p.y, x: p.x, y: p.y }
    }
    const drag = (e: PointerEvent) => {
      if (!aim) return
      const p = toCourse(e)
      aim.x = p.x
      aim.y = p.y
    }
    const up = () => {
      if (!aim) return
      const px = aim.sx - aim.x
      const py = aim.sy - aim.y
      const len = Math.hypot(px, py)
      aim = null
      if (len < 6) return
      const power = Math.min(MAX_PULL, len) / MAX_PULL
      ball.vx = (px / len) * power * MAX_SPEED
      ball.vy = (py / len) * power * MAX_SPEED
      strokes++
      cb.current.onStroke(strokes)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', drag)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', drag)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  }, [course])

  return <canvas ref={canvas} className="golf-canvas" aria-label="Mini golf: drag back and release to putt" />
}
