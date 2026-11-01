import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'motion/react'
import { profile, sections, type RouteId } from '../data'
import { EASE_IN_OUT, EASE_OUT, ENTER_DELAY, pointFromEvent, useClock, useNav } from '../lib/nav'
import { RollText } from './RollText'

/** Flips black ↔ white with an ink circle spreading from the toggle (View Transitions API). */
function toggleTheme(e: MouseEvent<HTMLElement>) {
  const root = document.documentElement
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark'
  const apply = () => {
    root.dataset.theme = next
  }
  if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    apply()
    return
  }
  const { clientX: x, clientY: y } = e
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  document.startViewTransition(apply).ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 750, easing: 'cubic-bezier(0.76, 0, 0.24, 1)', pseudoElement: '::view-transition-new(root)' },
    )
  })
}

interface Rect {
  x: number
  w: number
}

/**
 * Section links in a soft-cornered tray. The active marker is a gooey blob: a fast head
 * and a lagging tail melt together while travelling, and a small bead slides under
 * whatever link you hover. Labels use `difference` blending so they invert as ink passes.
 */
function LiquidLinks({ route, onPick }: { route: RouteId; onPick: (id: RouteId) => (e: MouseEvent<HTMLElement>) => void }) {
  const links = sections.filter((s) => s.id !== 'home')
  const wrap = useRef<HTMLElement>(null)
  const refs = useRef<Partial<Record<RouteId, HTMLButtonElement | null>>>({})
  const [rects, setRects] = useState<Partial<Record<RouteId, Rect>>>({})
  const [hover, setHover] = useState<RouteId | null>(null)

  useLayoutEffect(() => {
    const measure = () => {
      const next: Partial<Record<RouteId, Rect>> = {}
      for (const s of links) {
        const el = refs.current[s.id]
        if (el) next[s.id] = { x: el.offsetLeft, w: el.offsetWidth }
      }
      setRects(next)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (wrap.current) ro.observe(wrap.current)
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const active = rects[route]
  const target = hover ? rects[hover] : undefined

  const headX = useSpring(0, { stiffness: 420, damping: 34 })
  const headW = useSpring(0, { stiffness: 420, damping: 34 })
  const tailX = useSpring(0, { stiffness: 120, damping: 20 })
  const tailW = useSpring(0, { stiffness: 120, damping: 20 })
  const beadX = useSpring(0, { stiffness: 260, damping: 22 })
  const beadS = useSpring(0, { stiffness: 300, damping: 18 })

  useEffect(() => {
    if (!active) return
    headX.set(active.x)
    headW.set(active.w)
    tailX.set(active.x + active.w * 0.15)
    tailW.set(active.w * 0.7)
  }, [active, headX, headW, tailX, tailW])

  useEffect(() => {
    if (target && hover !== route) {
      beadX.set(target.x + target.w / 2 - 4)
      beadS.set(1)
    } else {
      if (active) beadX.set(active.x + active.w / 2 - 4)
      beadS.set(0)
    }
  }, [target, hover, route, active, beadX, beadS])

  return (
    <nav className="nav-pill" ref={wrap} aria-label="Sections" onMouseLeave={() => setHover(null)}>
      <span className="goo" aria-hidden>
        {active && (
          <>
            <motion.span className="goo-blob" style={{ x: headX, width: headW }} />
            <motion.span className="goo-blob goo-tail" style={{ x: tailX, width: tailW }} />
          </>
        )}
      </span>
      <motion.span className="goo-bead" style={{ x: beadX, scale: beadS }} aria-hidden />
      {links.map((s) => (
        <button
          key={s.id}
          ref={(el) => {
            refs.current[s.id] = el
          }}
          className={`nav-link roll-host${route === s.id ? ' is-active' : ''}`}
          onClick={onPick(s.id)}
          onMouseEnter={() => setHover(s.id)}
          onFocus={() => setHover(s.id)}
          onBlur={() => setHover(null)}
          data-cursor="go"
          aria-current={route === s.id ? 'page' : undefined}
        >
          <span className="nav-idx">{s.index}</span>
          <RollText text={s.label} />
        </button>
      ))}
    </nav>
  )
}

/** A half-lit moon: the lit side swings round each time you flip the lights. */
function ThemeOrb() {
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark')
  return (
    <motion.button
      className="theme-orb"
      onClick={(e) => {
        toggleTheme(e)
        setDark((d) => !d)
      }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.85 }}
      data-cursor="flip"
      aria-label="Toggle dark mode"
    >
      <motion.span className="orb-half" animate={{ rotate: dark ? 180 : 0 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }} />
    </motion.button>
  )
}

export function Nav() {
  const { route, go } = useNav()
  const [open, setOpen] = useState(false)
  const time = useClock(profile.timezone)
  const [tucked, setTucked] = useState(false)
  const { scrollY } = useScroll()

  // Get out of the way while reading down; come back the moment you scroll up.
  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setTucked(y > 160 && y > prev)
  })

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  const navTo = (id: (typeof sections)[number]['id']) => (e: MouseEvent<HTMLElement>) => {
    setOpen(false)
    go(id, pointFromEvent(e))
  }

  // Each floating piece tucks away a beat after the one before it.
  const tuck = (i: number) => ({
    animate: { y: tucked && !open ? -110 : 0, rotate: tucked && !open ? (i - 1) * 6 : 0 },
    transition: { duration: 0.6, ease: EASE_OUT, delay: i * 0.05 },
  })

  return (
    <>
      <svg className="goo-defs" aria-hidden>
        <filter id="goo" x="-20%" y="-60%" width="140%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
          <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
        </filter>
      </svg>

      <motion.header
        className="nav"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE_OUT, delay: ENTER_DELAY + 0.5 }}
      >
        <motion.button className="nav-badge" onClick={navTo('home')} data-cursor="home" aria-label="Home" whileTap={{ scale: 0.88 }} {...tuck(0)}>
          <svg className="badge-ring" viewBox="0 0 100 100" aria-hidden>
            <defs>
              <path id="badge-path" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
            </defs>
            <text>
              <textPath href="#badge-path" textLength="236">
                {`${profile.firstName} ${profile.lastName} ✺ portfolio ✺ `}
              </textPath>
            </text>
          </svg>
          <span className="badge-core">{profile.firstName[0]}</span>
        </motion.button>

        <motion.div className="nav-pill-wrap" {...tuck(1)}>
          <LiquidLinks route={route} onPick={navTo} />
        </motion.div>

        <motion.div className="nav-right" {...tuck(2)}>
          <span className="nav-time">
            <span className="pulse-dot" />
            {time}
          </span>
          <ThemeOrb />
          <motion.button
            className={`burger${open ? ' is-open' : ''}`}
            onClick={() => setOpen((o) => !o)}
            whileTap={{ scale: 0.85 }}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            data-cursor={open ? 'close' : 'menu'}
          >
            <span />
            <span />
          </motion.button>
        </motion.div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="menu"
            initial={{ clipPath: 'circle(0% at 100% 0%)' }}
            animate={{ clipPath: 'circle(150% at 100% 0%)' }}
            exit={{ clipPath: 'circle(0% at 100% 0%)' }}
            transition={{ duration: 0.75, ease: EASE_IN_OUT }}
          >
            <ul>
              {sections.map((s, i) => (
                <li key={s.id} className="mask">
                  <motion.button
                    className="menu-link roll-host"
                    initial={{ y: '110%', rotate: 5 }}
                    animate={{ y: '0%', rotate: 0 }}
                    exit={{ y: '110%' }}
                    transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.25 + i * 0.06 }}
                    onClick={navTo(s.id)}
                  >
                    <span className="menu-idx">{s.index}</span>
                    <RollText text={s.title} />
                  </motion.button>
                </li>
              ))}
            </ul>
            <motion.p className="menu-foot" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.7 } }} exit={{ opacity: 0 }}>
              {profile.location} · {time}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
