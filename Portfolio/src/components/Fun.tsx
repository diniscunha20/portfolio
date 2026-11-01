import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useMotionValue, useSpring } from 'motion/react'

const GLYPHS = '!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** Text that briefly decodes itself from gibberish whenever `trigger` changes. */
export function Scramble({ text, trigger }: { text: string; trigger: unknown }) {
  const [out, setOut] = useState(text)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    let frame = 0
    const total = text.length * 2 + 6
    const id = window.setInterval(() => {
      frame++
      setOut(
        [...text]
          .map((c, i) => (c === ' ' || frame / 2 > i + 3 ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join(''),
      )
      if (frame >= total) {
        window.clearInterval(id)
        setOut(text)
      }
    }, 28)
    return () => window.clearInterval(id)
  }, [trigger, text])

  return <span aria-label={text}>{out}</span>
}

/** A pair of eyes that follow the cursor around and blink when they feel like it. */
export function Eyes({ size = 64, className }: { size?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const px = useSpring(useMotionValue(0), { stiffness: 300, damping: 20 })
  const py = useSpring(useMotionValue(0), { stiffness: 300, damping: 20 })
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const r = ref.current?.getBoundingClientRect()
      if (!r) return
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const angle = Math.atan2(dy, dx)
      const dist = Math.min(size * 0.22, Math.hypot(dx, dy) / 12)
      px.set(Math.cos(angle) * dist)
      py.set(Math.sin(angle) * dist)
    }
    window.addEventListener('pointermove', onMove)

    let t: number
    const loop = () => {
      t = window.setTimeout(() => {
        setBlink(true)
        window.setTimeout(() => setBlink(false), 140)
        loop()
      }, 1800 + Math.random() * 2800)
    }
    loop()
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.clearTimeout(t)
    }
  }, [px, py, size])

  return (
    <div ref={ref} className={`eyes ${className ?? ''}`} style={{ ['--eye' as string]: `${size}px` }} aria-hidden>
      {[0, 1].map((i) => (
        <motion.div key={i} className="eye" animate={{ scaleY: blink ? 0.08 : 1 }} transition={{ duration: 0.08 }}>
          <motion.div className="pupil" style={{ x: px, y: py }} />
        </motion.div>
      ))}
    </div>
  )
}

/** Counts up from zero the first time it scrolls into view. */
export function CountUp({ to, suffix = '', duration = 1.6 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setN(Math.round(v)) })
    return () => controls.stop()
  }, [inView, to, duration])

  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  )
}
