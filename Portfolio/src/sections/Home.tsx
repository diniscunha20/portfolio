import { useState, type MouseEvent } from 'react'
import { motion } from 'motion/react'
import { YEAR, profile, sections } from '../data'
import { EASE_OUT, ENTER_DELAY, pointFromEvent, useNav } from '../lib/nav'
import { SplitText } from '../components/SplitText'
import { Arrow } from '../components/Btn'
import { Marquee } from '../components/Marquee'
import { BugSquash } from '../components/BugSquash'
import { NextUp } from '../components/PageBits'

/** Letters fall in like they were dropped from the nav bar. */
function DropName({ text, delay, italic }: { text: string; delay: number; italic?: boolean }) {
  return (
    <span className={`hero-line${italic ? ' italic' : ''}`} aria-label={text}>
      {[...text].map((c, i) => (
        <motion.span
          key={i}
          className="hero-char"
          aria-hidden
          initial={{ y: '-120%', rotate: (i % 2 ? 1 : -1) * 25, opacity: 0 }}
          animate={{ y: '0%', rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 13, mass: 1.1, delay: delay + i * 0.06 }}
        >
          {c}
        </motion.span>
      ))}
    </span>
  )
}

/** Compact list of the other sections; hovering one spotlights it and dims the rest. */
function Aspects() {
  const { go } = useNav()
  const [hovered, setHovered] = useState<string | null>(null)
  const list = sections.filter((s) => s.id !== 'home')

  return (
    <ul className="aspects" onMouseLeave={() => setHovered(null)}>
      {list.map((s, i) => (
        <motion.li
          key={s.id}
          initial={false}
          animate={{ opacity: hovered && hovered !== s.id ? 0.25 : 1 }}
          transition={{ duration: 0.35 }}
        >
          <motion.button
            className="aspect"
            onClick={(e: MouseEvent) => go(s.id, pointFromEvent(e))}
            onMouseEnter={() => setHovered(s.id)}
            onFocus={() => setHovered(s.id)}
            onBlur={() => setHovered(null)}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: ENTER_DELAY + 0.9 + i * 0.08 }}
            data-cursor="enter"
          >
            <span className="aspect-num">{s.index}</span>
            <span className="aspect-title">{s.title}</span>
            <span className="aspect-quip">{s.quip}</span>
            <span className="aspect-arrow">
              <Arrow dir="e" />
            </span>
            <span className="aspect-line" />
          </motion.button>
        </motion.li>
      ))}
    </ul>
  )
}

export function Home() {
  return (
    <div className="page home">
      <section className="hero">
        <div className="hero-left">
          <motion.div className="hero-top" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: ENTER_DELAY + 0.6, duration: 0.8 }}>
            <span>(Portfolio)</span>
            <span>Est. {YEAR}</span>
          </motion.div>

          <h1 className="hero-name">
            <DropName text={profile.firstName} delay={ENTER_DELAY} />
            <DropName text={profile.lastName} delay={ENTER_DELAY + 0.25} italic />
          </h1>

          <p className="hero-tagline">
            <SplitText text={profile.tagline} delay={ENTER_DELAY + 0.6} stagger={0.02} italicWords={['architecture']} />
          </p>

          <Aspects />
        </div>

        <motion.aside
          className="hero-right"
          initial={{ opacity: 0, y: 60, rotate: 3 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 16, delay: ENTER_DELAY + 0.5 }}
        >
          <span className="game-hint">psst — take a break ↓</span>
          <BugSquash />
        </motion.aside>
      </section>

      <Marquee speed={3} className="big-marquee">
        <span>Frontend</span>
        <span className="star">✺</span>
        <span className="italic">UI / UX</span>
        <span className="star">✺</span>
        <span>Enterprise architecture</span>
        <span className="star">✺</span>
        <span className="italic">Design</span>
        <span className="star">✺</span>
      </Marquee>

      <NextUp from="home" />
    </div>
  )
}
