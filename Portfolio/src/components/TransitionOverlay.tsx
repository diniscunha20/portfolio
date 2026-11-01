import { useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import type { Section, TransitionVariant } from '../data'
import { EASE_IN_OUT, EASE_OUT, type Point } from '../lib/nav'

export type Phase = 'cover' | 'reveal'

export interface TransitionState {
  key: number
  to: Section
  origin: Point
  phase: Phase
}

// Every variant is choreographed to fit inside these windows (seconds).
const COVER = 0.8
const HOLD = 0.45
const REVEAL = 1

interface Props {
  state: TransitionState
  onCovered: () => void
  onRevealed: () => void
}

export function TransitionOverlay({ state, onCovered, onRevealed }: Props) {
  const { phase, to, origin } = state

  useEffect(() => {
    const ms = phase === 'cover' ? (COVER + HOLD) * 1000 : REVEAL * 1000
    const t = window.setTimeout(phase === 'cover' ? onCovered : onRevealed, ms)
    return () => window.clearTimeout(t)
  }, [phase, onCovered, onRevealed])

  return (
    <div className="overlay" aria-hidden>
      <Shapes variant={to.transition} phase={phase} origin={origin} />
      <div className="overlay-label">
        <div className="mask">
          <motion.div
            className="overlay-index"
            initial={{ y: '110%' }}
            animate={{ y: phase === 'cover' ? '0%' : '-110%' }}
            transition={{ duration: phase === 'cover' ? 0.6 : 0.35, delay: phase === 'cover' ? 0.35 : 0, ease: EASE_OUT }}
          >
            ({to.index})
          </motion.div>
        </div>
        <div className="mask">
          <motion.div
            className="overlay-title"
            initial={{ y: '110%', rotate: 6 }}
            animate={phase === 'cover' ? { y: '0%', rotate: 0 } : { y: '-110%', rotate: -4 }}
            transition={{ duration: phase === 'cover' ? 0.7 : 0.4, delay: phase === 'cover' ? 0.4 : 0.03, ease: EASE_OUT }}
          >
            {to.title}
          </motion.div>
        </div>
        <motion.div
          className="overlay-quip"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'cover' ? 1 : 0 }}
          transition={{ duration: 0.3, delay: phase === 'cover' ? 0.6 : 0 }}
        >
          {to.quip}
          <span className="dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </motion.div>
      </div>
    </div>
  )
}

interface ShapeProps {
  variant: TransitionVariant
  phase: Phase
  origin: Point
}

const revealDelay = 0.18

function Shapes({ variant, phase, origin }: ShapeProps) {
  switch (variant) {
    case 'stairs':
      return <Stairs phase={phase} />
    case 'circle':
      return <Circle phase={phase} origin={origin} />
    case 'tiles':
      return <Tiles phase={phase} origin={origin} />
    case 'blinds':
      return <Blinds phase={phase} />
    default:
      return <Curtain phase={phase} />
  }
}

/** Columns rise like a staircase, then drop away the same way. */
function Stairs({ phase }: { phase: Phase }) {
  const cols = 6
  return (
    <div className="ov-stairs">
      {Array.from({ length: cols }, (_, i) => (
        <motion.div
          key={i}
          className="ov-fill"
          style={{ originY: phase === 'cover' ? 1 : 0 }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: phase === 'cover' ? 1 : 0 }}
          transition={{
            duration: 0.55,
            ease: EASE_IN_OUT,
            delay: phase === 'cover' ? i * 0.05 : revealDelay + i * 0.05,
          }}
        />
      ))}
    </div>
  )
}

/** Ink blot grows from wherever you clicked; leaves as an iris closing on the centre. */
function Circle({ phase, origin }: { phase: Phase; origin: Point }) {
  const w = window.innerWidth
  const h = window.innerHeight
  const r = Math.hypot(Math.max(origin.x, w - origin.x), Math.max(origin.y, h - origin.y)) + 20
  const rCenter = Math.hypot(w / 2, h / 2) + 20
  return (
    <motion.div
      className="ov-fill ov-full"
      initial={{ clipPath: `circle(0px at ${origin.x}px ${origin.y}px)` }}
      animate={{
        clipPath:
          phase === 'cover'
            ? `circle(${r}px at ${origin.x}px ${origin.y}px)`
            : [`circle(${rCenter}px at ${w / 2}px ${h / 2}px)`, `circle(0px at ${w / 2}px ${h / 2}px)`],
      }}
      transition={{ duration: phase === 'cover' ? 0.75 : 0.75, ease: EASE_IN_OUT, delay: phase === 'cover' ? 0 : revealDelay }}
    />
  )
}

/** A grid of squares pops in as a ripple from the click, then ripples back out. */
function Tiles({ phase, origin }: { phase: Phase; origin: Point }) {
  const { cols, rows, tiles } = useMemo(() => {
    const w = window.innerWidth
    const h = window.innerHeight
    const cols = w < 700 ? 6 : 12
    const size = w / cols
    const rows = Math.ceil(h / size)
    const maxD = Math.hypot(w, h)
    const tiles = Array.from({ length: cols * rows }, (_, i) => {
      const cx = (i % cols) * size + size / 2
      const cy = Math.floor(i / cols) * size + size / 2
      return Math.hypot(cx - origin.x, cy - origin.y) / maxD
    })
    return { cols, rows, tiles }
  }, [origin])

  return (
    <div className="ov-tiles" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, ${100 / cols}vw)` }}>
      {tiles.map((d, i) => (
        <motion.div
          key={i}
          className="ov-fill"
          initial={{ scale: 0, borderRadius: '50%' }}
          animate={phase === 'cover' ? { scale: 1.04, borderRadius: '0%' } : { scale: 0, borderRadius: '50%' }}
          transition={{
            duration: 0.4,
            ease: EASE_IN_OUT,
            delay: phase === 'cover' ? d * 0.45 : revealDelay + d * 0.45,
          }}
        />
      ))}
    </div>
  )
}

/** Horizontal slats zip in from alternating sides, like a zipper. */
function Blinds({ phase }: { phase: Phase }) {
  const rows = 8
  return (
    <div className="ov-blinds">
      {Array.from({ length: rows }, (_, i) => {
        const left = i % 2 === 0
        return (
          <motion.div
            key={i}
            className="ov-fill"
            style={{ originX: phase === 'cover' ? (left ? 0 : 1) : left ? 1 : 0 }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: phase === 'cover' ? 1.01 : 0 }}
            transition={{
              duration: 0.55,
              ease: EASE_IN_OUT,
              delay: phase === 'cover' ? i * 0.03 : revealDelay + i * 0.03,
            }}
          />
        )
      })}
    </div>
  )
}

/** A soft, rounded curtain rises from the floor and exits through the ceiling. */
function Curtain({ phase }: { phase: Phase }) {
  return (
    <motion.div
      className="ov-fill ov-full"
      initial={{ y: '100%', borderRadius: '50% 50% 0% 0% / 30vh 30vh 0vh 0vh' }}
      animate={
        phase === 'cover'
          ? { y: '0%', borderRadius: '0% 0% 0% 0% / 0vh 0vh 0vh 0vh' }
          : { y: '-100%', borderRadius: '0% 0% 50% 50% / 0vh 0vh 30vh 30vh' }
      }
      transition={{ duration: 0.8, ease: EASE_IN_OUT, delay: phase === 'cover' ? 0 : revealDelay }}
    />
  )
}
