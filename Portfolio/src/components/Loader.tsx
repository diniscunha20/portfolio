import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { YEAR, loaderQuips, profile } from '../data'
import { EASE_IN_OUT, EASE_OUT } from '../lib/nav'
import { Eyes } from './Fun'
import { Btn, Arrow } from './Btn'
import { Golf } from './Golf'
import { randomCourse } from '../lib/courses'

const verdict = (strokes: number, par: number) => {
  if (strokes === 1) return 'HOLE IN ONE. Absolute legend.'
  if (strokes === par - 2) return 'Eagle! Show-off.'
  if (strokes === par - 1) return 'Birdie! Smooth operator.'
  if (strokes === par) return 'Par. Respectable.'
  if (strokes === par + 1) return 'Bogey. It happens.'
  return `${strokes} strokes. We'll call that a warm-up.`
}

/** One slot-machine reel per digit. */
function Digit({ value }: { value: number }) {
  return (
    <span className="reel">
      <motion.span
        className="reel-strip"
        animate={{ y: `${-value * 10}%` }}
        transition={{ type: 'spring', stiffness: 140, damping: 18 }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i}>{i}</span>
        ))}
      </motion.span>
    </span>
  )
}

export function Loader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [strokes, setStrokes] = useState(0)
  const [sunk, setSunk] = useState<number | null>(null)
  // a different hole every visit
  const [course] = useState(randomCourse)
  const [holeNo] = useState(() => String(1 + Math.floor(Math.random() * 18)).padStart(2, '0'))

  // Fake-but-honest progress: lurches forward, stalls dramatically at 99, waits for fonts.
  useEffect(() => {
    let p = 0
    let alive = true
    const fonts = document.fonts?.ready ?? Promise.resolve()
    const tick = () => {
      if (!alive) return
      if (p >= 99) {
        fonts.then(() => {
          window.setTimeout(() => {
            if (!alive) return
            setProgress(100)
            setReady(true)
          }, 550)
        })
        return
      }
      p = Math.min(99, p + Math.ceil(Math.random() * 9))
      setProgress(p)
      const pause = Math.random() < 0.15 ? 420 : 90 + Math.random() * 130
      window.setTimeout(tick, pause)
    }
    const start = window.setTimeout(tick, 350)
    return () => {
      alive = false
      window.clearTimeout(start)
    }
  }, [])

  // Sinking the putt is a ticket in — as soon as the site is actually ready.
  useEffect(() => {
    if (sunk === null || !ready) return
    const t = window.setTimeout(onDone, 1600)
    return () => window.clearTimeout(t)
  }, [sunk, ready, onDone])

  // Enter key works as the "Enter" button once loaded.
  useEffect(() => {
    if (!ready) return
    const onKey = (e: KeyboardEvent) => e.key === 'Enter' && onDone()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ready, onDone])

  const onSink = useCallback((n: number) => setSunk(n), [])

  const digits = String(progress).padStart(3, '0').split('').map(Number)
  const quip = loaderQuips[Math.min(loaderQuips.length - 1, Math.floor((progress / 100) * loaderQuips.length))]
  const happy = ready || sunk !== null

  const message =
    sunk !== null
      ? verdict(sunk, course.par) + (ready ? '' : ' (still loading, hang tight)')
      : strokes === 0
        ? 'Drag back anywhere on the course, let go to putt.'
        : strokes >= 6
          ? 'The cup is the little circle. Just saying.'
          : course.movers.length
            ? 'Mind the moving blocks.'
            : 'Walls are your friends. Bank it.'

  return (
    <motion.div
      className="loader"
      initial={{ y: 0 }}
      exit={{ y: '-100%', borderBottomLeftRadius: '50% 20vh', borderBottomRightRadius: '50% 20vh' }}
      transition={{ duration: 1, ease: EASE_IN_OUT }}
    >
      <motion.div className="loader-inner" exit={{ y: '30vh', opacity: 0 }} transition={{ duration: 0.8, ease: EASE_IN_OUT }}>
        <div className="loader-top">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: happy ? 1.15 : 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14, delay: happy ? 0 : 0.15 }}
            className="loader-face"
          >
            <Eyes size={30} />
            <motion.svg viewBox="0 0 60 20" className="loader-mouth" aria-hidden>
              <motion.path
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ d: 'M10 10 Q30 10 50 10' }}
                animate={{ d: happy ? 'M8 4 Q30 26 52 4' : 'M14 10 Q30 10 46 10' }}
                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
              />
            </motion.svg>
          </motion.div>

          <div className="loader-count" aria-label={`${progress} percent`}>
            {digits.map((d, i) => (
              <Digit key={i} value={d} />
            ))}
            <span className="loader-pct">%</span>
          </div>

          <div className="loader-quip mask">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={quip}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
              >
                {quip}
                <span className="caret" />
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <motion.div
          className="golf"
          initial={{ opacity: 0, y: 40, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.3 }}
        >
          <div className="golf-hud">
            <span>
              Hole {holeNo} · Par {course.par}
            </span>
            <span className="golf-title">“{course.name}” — while you wait…</span>
            <span>
              Strokes{' '}
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.b
                  key={strokes}
                  initial={{ y: -12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 12, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                >
                  {strokes}
                </motion.b>
              </AnimatePresence>
            </span>
          </div>
          <div className="golf-course">
            <Golf course={course} onStroke={setStrokes} onSink={onSink} />
            <AnimatePresence>
              {sunk !== null && (
                <motion.div
                  className="golf-sunk"
                  initial={{ scale: 0, rotate: -12 }}
                  animate={{ scale: 1, rotate: -4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                >
                  {sunk === 1 ? 'Hole in one!' : 'Sunk it!'}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="golf-msg mask">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={message}
                initial={{ y: '100%' }}
                animate={{ y: '0%' }}
                exit={{ y: '-100%' }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
              >
                {message}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="loader-enter">
          <AnimatePresence mode="wait">
            {ready ? (
              <motion.div
                key="enter"
                initial={{ scale: 0, rotate: 8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 14 }}
              >
                <Btn label="Enter the site" variant="solid" icon={<Arrow />} onClick={onDone} />
              </motion.div>
            ) : (
              <motion.span key="wait" className="loader-wait" exit={{ opacity: 0 }}>
                the door opens at 100%
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="loader-foot">
        <span>
          {profile.firstName} {profile.lastName}
        </span>
        <span>Portfolio — ©{YEAR}</span>
      </div>
      <motion.div className="loader-bar" initial={{ scaleX: 0 }} animate={{ scaleX: progress / 100 }} transition={{ ease: EASE_OUT, duration: 0.4 }} />
    </motion.div>
  )
}
