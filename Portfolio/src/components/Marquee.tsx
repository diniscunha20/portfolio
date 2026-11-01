import { useRef, type ReactNode } from 'react'
import { motion, useAnimationFrame, useMotionValue, useScroll, useSpring, useTransform, useVelocity, wrap } from 'motion/react'

interface Props {
  children: ReactNode
  /** percent of one copy per second */
  speed?: number
  className?: string
}

/** Infinite ticker that speeds up — and flips direction — with your scroll. */
export function Marquee({ children, speed = 4, className }: Props) {
  const base = useMotionValue(0)
  const { scrollY } = useScroll()
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 })
  const boost = useTransform(velocity, [-1500, 0, 1500], [-5, 0, 5], { clamp: false })
  const direction = useRef(1)
  const x = useTransform(base, (v) => `${wrap(-25, -50, v)}%`)

  useAnimationFrame((_, delta) => {
    const b = boost.get()
    if (b < -0.05) direction.current = -1
    else if (b > 0.05) direction.current = 1
    const move = speed * (delta / 1000) * (1 + Math.abs(b))
    base.set(base.get() - move * direction.current)
  })

  return (
    <div className={`marquee ${className ?? ''}`}>
      <motion.div className="marquee-track" style={{ x }}>
        {[0, 1, 2, 3].map((i) => (
          <div className="marquee-copy" key={i} aria-hidden={i > 0}>
            {children}
          </div>
        ))}
      </motion.div>
    </div>
  )
}
