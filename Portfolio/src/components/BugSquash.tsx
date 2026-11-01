import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import { EASE_OUT } from '../lib/nav'
import { Btn } from './Btn'

const DURATION = 20 // seconds per round
const HOLES = 9
const BEST_KEY = 'bug-squash-best'

type Kind = 'bug' | 'feature'
interface Occupant {
  id: number
  kind: Kind
  life: number
  squashed?: boolean
}
interface Popup {
  id: number
  hole: number
  text: string
}
type Phase = 'idle' | 'countdown' | 'playing' | 'over'

let uid = 0
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const readBest = () => {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0
  } catch {
    return 0
  }
}

const verdict = (score: number) => {
  if (score <= 0) return 'The bugs won. They always do.'
  if (score < 8) return 'Junior dev energy. Cute.'
  if (score < 16) return 'LGTM. Ship it.'
  if (score < 24) return 'Senior bug exterminator.'
  return '10x developer (allegedly).'
}

function BugSprite() {
  return (
    <svg viewBox="0 0 60 60" className="bug-svg" aria-hidden>
      <g className="bug-legs" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M18 28 L6 22" />
        <path d="M17 36 L5 36" />
        <path d="M18 44 L7 51" />
        <path d="M42 28 L54 22" />
        <path d="M43 36 L55 36" />
        <path d="M42 44 L53 51" />
      </g>
      <path d="M24 14 L18 5 M36 14 L42 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="30" cy="18" r="8" fill="currentColor" />
      <ellipse cx="30" cy="38" rx="13" ry="16" fill="currentColor" />
      <path d="M30 24 V53" stroke="var(--bg)" strokeWidth="1.5" />
      <circle cx="26.5" cy="17" r="2.2" fill="var(--bg)" />
      <circle cx="33.5" cy="17" r="2.2" fill="var(--bg)" />
    </svg>
  )
}

function Splat() {
  return (
    <svg viewBox="0 0 60 60" className="bug-svg" aria-hidden>
      <path
        d="M30 8 C35 16 44 8 44 18 C52 18 56 26 48 31 C56 38 48 46 41 42 C40 52 32 54 29 46 C24 54 14 50 18 41 C8 42 6 32 14 29 C6 22 14 12 21 18 C21 9 27 4 30 8Z"
        fill="currentColor"
      />
      <path d="M22 26 l6 6 m0 -6 l-6 6 M34 26 l6 6 m0 -6 l-6 6" stroke="var(--bg)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function Hole({
  index,
  occupant,
  onHit,
  onExpire,
}: {
  index: number
  occupant: Occupant | null
  onHit: (index: number) => void
  onExpire: (id: number, kind: Kind) => void
}) {
  // Each critter leaves on its own when its time runs out.
  useEffect(() => {
    if (!occupant || occupant.squashed) return
    const t = window.setTimeout(() => onExpire(occupant.id, occupant.kind), occupant.life)
    return () => window.clearTimeout(t)
  }, [occupant, onExpire])

  return (
    <motion.button
      className="hole"
      onPointerDown={() => onHit(index)}
      whileTap={{ scale: 0.92 }}
      data-cursor={occupant?.kind === 'feature' ? 'careful' : 'squash!'}
      aria-label={occupant ? (occupant.kind === 'bug' ? 'Bug! Squash it' : 'Feature, leave it') : 'Empty'}
    >
      <span className="hole-pit" />
      <span className="hole-mask">
        <AnimatePresence>
          {occupant && (
            <motion.span
              key={occupant.id}
              className={`critter critter-${occupant.kind}`}
              initial={{ y: '110%' }}
              animate={occupant.squashed ? { y: '0%', scaleY: 0.55, scaleX: 1.25 } : { y: '0%', scaleY: 1, scaleX: 1 }}
              exit={occupant.squashed ? { opacity: 0, scale: 0.6, transition: { duration: 0.25 } } : { y: '110%', transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 520, damping: 22 }}
            >
              {occupant.kind === 'feature' ? (
                <span className="feature">
                  ✦<small>feature</small>
                </span>
              ) : occupant.squashed ? (
                <Splat />
              ) : (
                <BugSprite />
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  )
}

/** Whack-a-mole, but it's bugs. Don't squash the features. */
export function BugSquash() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [count, setCount] = useState(3)
  const [holes, setHoles] = useState<(Occupant | null)[]>(() => Array(HOLES).fill(null))
  const [score, setScore] = useState(0)
  const [escaped, setEscaped] = useState(0)
  const [combo, setCombo] = useState(0)
  const [best, setBest] = useState(readBest)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [popups, setPopups] = useState<Popup[]>([])
  const [newBest, setNewBest] = useState(false)
  const start = useRef(0)
  const lastHit = useRef(0)
  const holesRef = useRef(holes)
  useEffect(() => {
    holesRef.current = holes
  }, [holes])
  const scoreRef = useRef(0)
  const [scope, animate] = useAnimate()

  const pop = (hole: number, text: string) => {
    const id = ++uid
    setPopups((p) => [...p, { id, hole, text }])
    window.setTimeout(() => setPopups((p) => p.filter((x) => x.id !== id)), 800)
  }

  const shake = () => animate(scope.current, { x: [0, -10, 9, -6, 4, 0] }, { duration: 0.4 })

  const begin = () => {
    setScore(0)
    scoreRef.current = 0
    setEscaped(0)
    setCombo(0)
    setNewBest(false)
    setHoles(Array(HOLES).fill(null))
    setCount(3)
    setPhase('countdown')
  }

  // 3… 2… 1…
  useEffect(() => {
    if (phase !== 'countdown') return
    const t = window.setTimeout(
      () => {
        if (count > 0) return setCount((c) => c - 1)
        start.current = performance.now()
        setTimeLeft(DURATION)
        setPhase('playing')
      },
      count > 0 ? 650 : 450,
    )
    return () => window.clearTimeout(t)
  }, [phase, count])

  // Spawner + clock. Everything speeds up as the round goes on.
  useEffect(() => {
    if (phase !== 'playing') return
    let spawnTimer = 0
    const spawn = () => {
      const t = Math.min(1, (performance.now() - start.current) / 1000 / DURATION)
      setHoles((hs) => {
        const empty = hs.flatMap((h, i) => (h ? [] : [i]))
        if (!empty.length) return hs
        const i = empty[Math.floor(Math.random() * empty.length)]
        const next = [...hs]
        next[i] = { id: ++uid, kind: Math.random() < 0.18 ? 'feature' : 'bug', life: lerp(1150, 620, t) }
        return next
      })
      spawnTimer = window.setTimeout(spawn, lerp(720, 330, t))
    }
    spawn()

    const clock = window.setInterval(() => {
      const left = Math.max(0, DURATION - (performance.now() - start.current) / 1000)
      setTimeLeft(left)
      if (left <= 0) {
        window.clearInterval(clock)
        window.clearTimeout(spawnTimer)
        setHoles(Array(HOLES).fill(null))
        const final = scoreRef.current
        if (final > readBest()) {
          try {
            localStorage.setItem(BEST_KEY, String(final))
          } catch {
            /* no storage, no glory */
          }
          setBest(final)
          setNewBest(final > 0)
        }
        setPhase('over')
      }
    }, 100)

    return () => {
      window.clearTimeout(spawnTimer)
      window.clearInterval(clock)
    }
  }, [phase])

  const onExpire = useCallback((id: number, kind: Kind) => {
    setHoles((hs) => hs.map((h) => (h?.id === id ? null : h)))
    if (kind === 'bug') {
      setEscaped((e) => e + 1)
      setCombo(0)
    }
  }, [])

  const onHit = (i: number) => {
    if (phase !== 'playing') return
    const o = holesRef.current[i]
    if (!o || o.squashed) {
      setCombo(0)
      pop(i, 'miss')
      return
    }
    if (o.kind === 'feature') {
      setHoles((hs) => hs.map((h, j) => (j === i ? null : h)))
      setCombo(0)
      scoreRef.current = Math.max(0, scoreRef.current - 3)
      setScore(scoreRef.current)
      pop(i, '−3 that was a feature!')
      shake()
      return
    }
    const now = performance.now()
    const nextCombo = now - lastHit.current < 900 ? combo + 1 : 1
    lastHit.current = now
    const pts = nextCombo >= 3 ? 2 : 1
    setCombo(nextCombo)
    scoreRef.current += pts
    setScore(scoreRef.current)
    pop(i, pts > 1 ? `+${pts} combo ×${nextCombo}` : '+1')
    setHoles((hs) => hs.map((h, j) => (j === i && h ? { ...h, squashed: true } : h)))
    window.setTimeout(() => setHoles((hs) => hs.map((h) => (h?.id === o.id ? null : h))), 260)
  }

  return (
    <div className="game" ref={scope}>
      <div className="game-bar">
        <span className="game-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="game-name">bug_squash.exe</span>
        <span className="game-best">best {best}</span>
      </div>

      <div className="game-hud">
        <div>
          <span className="hud-label">Score</span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={score}
              className="hud-score"
              initial={{ y: -20, opacity: 0, scale: 1.4 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              {score}
            </motion.span>
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {combo >= 3 && phase === 'playing' && (
            <motion.span
              className="hud-combo"
              key="combo"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: -6 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              on fire ×{combo}
            </motion.span>
          )}
        </AnimatePresence>
        <div className="hud-right">
          <span className="hud-label">Time</span>
          <span className="hud-time">{Math.ceil(timeLeft)}s</span>
        </div>
      </div>
      <div className="game-timer">
        <motion.span style={{ scaleX: phase === 'playing' ? timeLeft / DURATION : phase === 'over' ? 0 : 1 }} />
      </div>

      <div className="board">
        {holes.map((o, i) => (
          <div className="hole-cell" key={i}>
            <Hole index={i} occupant={o} onHit={onHit} onExpire={onExpire} />
            <AnimatePresence>
              {popups
                .filter((p) => p.hole === i)
                .map((p) => (
                  <motion.span
                    key={p.id}
                    className="popup"
                    initial={{ y: 0, opacity: 0, scale: 0.6 }}
                    animate={{ y: -46, opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, y: -60 }}
                    transition={{ duration: 0.5, ease: EASE_OUT }}
                  >
                    {p.text}
                  </motion.span>
                ))}
            </AnimatePresence>
          </div>
        ))}

        <AnimatePresence mode="wait">
          {phase !== 'playing' && (
            <motion.div
              key={phase === 'countdown' ? `count-${count}` : phase}
              className="board-screen"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.25 }}
            >
              {phase === 'idle' && (
                <>
                  <p className="screen-title">
                    Squash the <em>bugs</em>.
                  </p>
                  <p className="screen-sub">{DURATION} seconds. Leave the ✦ features alone.</p>
                  <Btn label="Start debugging" variant="solid" onClick={begin} cursor="go!" />
                </>
              )}
              {phase === 'countdown' && (
                <motion.span
                  className="screen-count"
                  initial={{ scale: 2.4, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                >
                  {count === 0 ? 'go!' : count}
                </motion.span>
              )}
              {phase === 'over' && (
                <>
                  {newBest && (
                    <motion.span className="screen-badge" initial={{ scale: 0, rotate: 30 }} animate={{ scale: 1, rotate: -8 }} transition={{ type: 'spring', delay: 0.3 }}>
                      new best!
                    </motion.span>
                  )}
                  <p className="screen-title">
                    {score} <em>squashed</em>
                  </p>
                  <p className="screen-sub">
                    {verdict(score)}
                    <br />
                    {escaped} {escaped === 1 ? 'bug' : 'bugs'} shipped to production.
                  </p>
                  <Btn label="Play again" variant="solid" onClick={begin} cursor="again!" />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
