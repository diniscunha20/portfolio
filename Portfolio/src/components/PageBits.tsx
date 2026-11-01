import type { MouseEvent } from 'react'
import { motion } from 'motion/react'
import { YEAR, profile, sections, type RouteId } from '../data'
import { EASE_OUT, ENTER_DELAY, pointFromEvent, useNav } from '../lib/nav'
import { SplitText } from './SplitText'
import { RollText } from './RollText'
import { Arrow, Btn } from './Btn'
import { Marquee } from './Marquee'

export function PageHeader({ id, title, italic, sub }: { id: RouteId; title: string; italic?: string[]; sub: string }) {
  const s = sections.find((x) => x.id === id)!
  return (
    <header className="page-head">
      <motion.span
        className="eyebrow"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: EASE_OUT, delay: ENTER_DELAY }}
      >
        ({s.index}) — {s.label}
      </motion.span>
      <h1 className="display">
        <SplitText text={title} by="char" delay={ENTER_DELAY + 0.05} stagger={0.025} italicWords={italic} />
      </h1>
      <motion.p
        className="lede"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE_OUT, delay: ENTER_DELAY + 0.45 }}
      >
        {sub}
      </motion.p>
      <motion.div
        className="rule"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, ease: EASE_OUT, delay: ENTER_DELAY + 0.3 }}
      />
    </header>
  )
}

/** Big "next aspect" link at the bottom of every page, so the tour never dead-ends. */
export function NextUp({ from }: { from: RouteId }) {
  const { go } = useNav()
  const i = sections.findIndex((s) => s.id === from)
  const next = sections[(i + 1) % sections.length]

  return (
    <footer className="footer">
      <Marquee speed={3} className="footer-marquee">
        <span>Keep exploring</span>
        <span className="star">✺</span>
        <span className="italic">there&apos;s more</span>
        <span className="star">✺</span>
      </Marquee>

      <motion.button
        className="next-up roll-host"
        onClick={(e: MouseEvent) => go(next.id, pointFromEvent(e))}
        data-cursor="next"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: EASE_OUT }}
      >
        <span className="next-label">Next up — ({next.index})</span>
        <span className="next-title">
          <RollText text={next.title} />
          <Arrow dir="e" />
        </span>
      </motion.button>

      <div className="footer-row">
        <span>
          © {YEAR} {profile.firstName} {profile.lastName}
        </span>
        <span className="footer-made">Built with React and Motion</span>
        <Btn label="Back to top" size="sm" icon={<Arrow dir="n" />} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} cursor="up!" />
      </div>
    </footer>
  )
}
