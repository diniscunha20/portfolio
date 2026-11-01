import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { AnimatePresence, MotionConfig, motion, useScroll, useSpring } from 'motion/react'
import { profile, sectionById, sections, type RouteId } from './data'
import { NavContext, type Point } from './lib/nav'
import { Loader } from './components/Loader'
import { Cursor } from './components/Cursor'
import { Nav } from './components/Nav'
import { BlockField } from './components/BlockField'
import { TransitionOverlay, type TransitionState } from './components/TransitionOverlay'
import { Home } from './sections/Home'
import { About } from './sections/About'
import { Projects } from './sections/Projects'
import { Designs } from './sections/Designs'
import { Activities } from './sections/Activities'
import { Socials } from './sections/Socials'

const pages: Record<RouteId, ComponentType> = {
  home: Home,
  about: About,
  projects: Projects,
  designs: Designs,
  activities: Activities,
  socials: Socials,
}

const routeFromHash = (): RouteId => {
  const h = window.location.hash.replace(/^#\/?/, '')
  return sections.some((s) => s.id === h) ? (h as RouteId) : 'home'
}

const center = (): Point => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 })

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 })
  return <motion.div className="scroll-progress" style={{ scaleX }} />
}

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [route, setRoute] = useState<RouteId>(routeFromHash)
  const [transition, setTransition] = useState<TransitionState | null>(null)
  const busy = useRef(false)

  const go = useCallback(
    (to: RouteId, origin: Point = center()) => {
      if (busy.current || to === route) return
      busy.current = true
      setTransition({ key: Date.now(), to: sectionById[to], origin, phase: 'cover' })
    },
    [route],
  )

  // Browser back/forward plays the transition too.
  useEffect(() => {
    const onHash = () => {
      const to = routeFromHash()
      if (to !== route) go(to)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [go, route])

  // Screen is fully covered: swap the page underneath, then lift the overlay.
  const onCovered = useCallback(() => {
    if (!transition) return
    const id = transition.to.id
    setRoute(id)
    const hash = id === 'home' ? '#/' : `#/${id}`
    if (window.location.hash !== hash) window.history.pushState(null, '', hash)
    window.scrollTo(0, 0)
    setTransition({ ...transition, phase: 'reveal' })
  }, [transition])

  const onRevealed = useCallback(() => {
    busy.current = false
    setTransition(null)
  }, [])

  const onLoaded = useCallback(() => setLoaded(true), [])

  useEffect(() => {
    const name = `${profile.firstName} ${profile.lastName}`
    document.title = route === 'home' ? `${name} — Portfolio` : `${sectionById[route].title} — ${name}`
  }, [route])

  const nav = useMemo(() => ({ route, go, busy: transition !== null }), [route, go, transition])
  const Page = pages[route]

  return (
    <MotionConfig reducedMotion="user">
      <NavContext.Provider value={nav}>
        <Cursor />
        <div className="grain" aria-hidden />

        <AnimatePresence>{!loaded && <Loader key="loader" onDone={onLoaded} />}</AnimatePresence>

        {loaded && (
          <>
            <BlockField />
            <ScrollProgress />
            <Nav />
            <main key={route}>
              <Page />
            </main>
          </>
        )}

        {transition && <TransitionOverlay key={transition.key} state={transition} onCovered={onCovered} onRevealed={onRevealed} />}
      </NavContext.Provider>
    </MotionConfig>
  )
}
