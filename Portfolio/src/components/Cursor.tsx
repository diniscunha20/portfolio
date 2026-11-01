import { useEffect, useRef, useState } from 'react'

const RADIUS = 13 // ball radius in CSS px
const LENGTH = 22 // frames of history in the tail
const FOLLOW = 0.32 // how eagerly the ball chases the pointer (0–1)

/**
 * The ball, with a liquid tail: every frame the ball's position is pushed onto a
 * short history, and the tail is drawn as a tube that tapers along it. When the
 * pointer rests, the history collapses and the tail retracts into the ball.
 * Blended with `difference`, so it reads black on light pages and white on dark.
 */
function InkTrail() {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvas.current
    const ctx = el?.getContext('2d')
    if (!el || !ctx) return

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const length = still ? 1 : LENGTH
    const mouse = { x: -100, y: -100 }
    const head = { x: -100, y: -100 }
    let trail: { x: number; y: number }[] = []
    let scale = 1
    let targetScale = 1
    let visible = false
    let raf = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      el.width = window.innerWidth * dpr
      el.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const frame = () => {
      head.x += (mouse.x - head.x) * (still ? 1 : FOLLOW)
      head.y += (mouse.y - head.y) * (still ? 1 : FOLLOW)
      scale += (targetScale - scale) * 0.25
      trail.unshift({ x: head.x, y: head.y })
      if (trail.length > length) trail.length = length

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      if (visible) {
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        // stamp overlapping discs along the history; together they read as one tapered tube
        for (let i = 0; i < trail.length; i++) {
          const a = trail[i]
          const b = trail[i + 1] ?? a
          const r0 = RADIUS * scale * Math.pow(1 - i / length, 1.3)
          const r1 = RADIUS * scale * Math.pow(1 - (i + 1) / length, 1.3)
          const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2))
          for (let s = 0; s < steps; s++) {
            const t = s / steps
            const r = r0 + (r1 - r0) * t
            if (r < 0.4) continue
            const x = a.x + (b.x - a.x) * t
            const y = a.y + (b.y - a.y) * t
            ctx.moveTo(x + r, y)
            ctx.arc(x, y, r, 0, Math.PI * 2)
          }
        }
        ctx.fill()
      }

      const settled =
        Math.abs(targetScale - scale) < 0.01 &&
        trail.length > 0 &&
        trail.every((p) => Math.abs(p.x - mouse.x) < 0.3 && Math.abs(p.y - mouse.y) < 0.3)
      raf = settled ? 0 : requestAnimationFrame(frame)
    }

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    const move = (e: PointerEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      if (!visible) {
        // appear where the pointer is instead of flying in from a corner
        head.x = mouse.x
        head.y = mouse.y
        trail = []
        visible = true
      }
      wake()
    }
    const press = () => {
      targetScale = 0.6
      wake()
    }
    const release = () => {
      targetScale = 1
      wake()
    }
    const leave = () => {
      visible = false
      wake()
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerdown', press)
    window.addEventListener('pointerup', release)
    document.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', release)
      document.removeEventListener('pointerleave', leave)
    }
  }, [])

  return <canvas ref={canvas} className="ink-trail" aria-hidden />
}

/** Custom cursor for mouse users; touch devices keep their native behaviour. */
export function Cursor() {
  const [enabled] = useState(() => window.matchMedia('(pointer: fine)').matches)

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('has-cursor')
    return () => document.documentElement.classList.remove('has-cursor')
  }, [enabled])

  return enabled ? <InkTrail /> : null
}
