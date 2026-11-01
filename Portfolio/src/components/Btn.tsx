import { useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'motion/react'
import { RollText } from './RollText'

interface Props {
  label: string
  onClick?: (e: MouseEvent<HTMLElement>) => void
  href?: string
  icon?: ReactNode
  variant?: 'outline' | 'solid'
  size?: 'sm' | 'md' | 'lg'
  cursor?: string
  active?: boolean
  className?: string
  ariaLabel?: string
}

let rippleId = 0

/**
 * The house button: magnetic pull, ink that floods in from the side you entered,
 * letters that roll, a squish on press and a ripple on click.
 */
export function Btn({ label, onClick, href, icon, variant = 'outline', size = 'md', cursor, active, className, ariaLabel }: Props) {
  const ref = useRef<HTMLElement>(null)
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 14, mass: 0.4 })
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 14, mass: 0.4 })
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])

  const setInk = (e: MouseEvent<HTMLElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--ink-x', `${e.clientX - r.left}px`)
    el.style.setProperty('--ink-y', `${e.clientY - r.top}px`)
  }

  const onMove = (e: MouseEvent<HTMLElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * 0.35)
    y.set((e.clientY - (r.top + r.height / 2)) * 0.45)
  }

  const onLeave = (e: MouseEvent<HTMLElement>) => {
    setInk(e)
    x.set(0)
    y.set(0)
  }

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    const r = ref.current?.getBoundingClientRect()
    if (r) {
      const id = ++rippleId
      setRipples((rs) => [...rs, { id, x: e.clientX - r.left, y: e.clientY - r.top }])
      window.setTimeout(() => setRipples((rs) => rs.filter((p) => p.id !== id)), 700)
    }
    onClick?.(e)
  }

  const common = {
    ref: ref as never,
    className: `btn btn-${variant} btn-${size} roll-host${active ? ' is-active' : ''} ${className ?? ''}`,
    style: { x, y },
    onMouseEnter: setInk,
    onMouseMove: onMove,
    onMouseLeave: onLeave,
    onClick: handleClick,
    whileTap: { scale: 0.9 },
    'data-cursor': cursor ?? 'click',
    'aria-label': ariaLabel,
  }

  const inner = (
    <>
      <span className="btn-ink" />
      <span className="btn-content">
        <RollText text={label} />
        {icon && <span className="btn-icon">{icon}</span>}
      </span>
      <AnimatePresence>
        {ripples.map((p) => (
          <motion.span
            key={p.id}
            className="btn-ripple"
            style={{ left: p.x, top: p.y }}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </>
  )

  return href ? (
    <motion.a href={href} target="_blank" rel="noreferrer" {...common}>
      {inner}
    </motion.a>
  ) : (
    <motion.button type="button" {...common}>
      {inner}
    </motion.button>
  )
}

/** Arrow that can be spun by CSS on hover. */
export const Arrow = ({ dir = 'ne' }: { dir?: 'ne' | 'e' | 's' | 'n' | 'w' }) => (
  <svg className={`arrow arrow-${dir}`} viewBox="0 0 24 24" width="1em" height="1em" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
