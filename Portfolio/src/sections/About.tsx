import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { profile, timeline } from '../data'
import { EASE_OUT, ENTER_DELAY } from '../lib/nav'
import { Eyes } from '../components/Fun'
import { NextUp, PageHeader } from '../components/PageBits'
import { SplitText } from '../components/SplitText'

const story =
  "I'm 20, from Barcelos, Portugal, and doing my Master's in Software Engineering at the University of Aveiro. Frontend was the first thing I wanted to code, and the reason I chose this degree. Finding unusual websites, and all the different ways the same content can be shown, only made me more interested in UI and UX. My bachelor's final project, Connecttion, an ERP for associations, pulled me towards enterprise architecture: how systems, processes and people fit together inside an organisation. That's the field I want to work in, and I'm taking my first steps towards a TOGAF certification."

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.12, 1])
  const y = useTransform(progress, range, [6, 0])
  return (
    <motion.span className="story-word" style={{ opacity, y }}>
      {children}{' '}
    </motion.span>
  )
}

/** Words light up one by one as you scroll past. */
function ScrollStory() {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const words = story.split(' ')
  return (
    <p ref={ref} className="story">
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
          {w}
        </Word>
      ))}
    </p>
  )
}

const skills = ['React', 'TypeScript', 'Python', 'PostgreSQL', 'Docker', 'UI / UX', 'Enterprise architecture', 'Security by design', 'Graphic design']

/** Chips you can fling around the box. Purely for fun. */
function SkillPit() {
  const box = useRef<HTMLDivElement>(null)
  return (
    <div className="skill-pit" ref={box}>
      <span className="skill-hint">drag us around ↓</span>
      {skills.map((s, i) => (
        <motion.span
          key={s}
          className="chip"
          drag
          dragConstraints={box}
          dragElastic={0.3}
          dragTransition={{ bounceStiffness: 400, bounceDamping: 12 }}
          whileDrag={{ scale: 1.15, rotate: (i % 2 ? 1 : -1) * 8, zIndex: 5 }}
          whileHover={{ scale: 1.06 }}
          initial={{ opacity: 0, y: -120, rotate: (i % 3 - 1) * 20 }}
          whileInView={{ opacity: 1, y: 0, rotate: (i % 3 - 1) * 4 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: i * 0.07 }}
          data-cursor="drag"
        >
          {s}
        </motion.span>
      ))}
    </div>
  )
}

export function About() {
  return (
    <div className="page about">
      <PageHeader id="about" title={`Hello, I'm ${profile.firstName}.`} italic={[profile.firstName]} sub={profile.role} />

      <section className="about-grid">
        <motion.figure
          className="portrait"
          initial={{ clipPath: 'inset(100% 0 0 0)' }}
          animate={{ clipPath: 'inset(0% 0 0 0)' }}
          transition={{ duration: 1.2, ease: EASE_OUT, delay: ENTER_DELAY + 0.3 }}
          data-cursor="hey"
        >
          <Eyes size={70} />
          <figcaption>Portrait coming soon</figcaption>
        </motion.figure>
        <ScrollStory />
      </section>


      <section className="timeline">
        <SplitText text="So far, so good" inView className="h2" italicWords={['good']} />
        <ul>
          {timeline.map((t, i) => (
            <motion.li
              key={t.year + i}
              initial="hidden"
              whileInView="shown"
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ staggerChildren: 0.1 }}
            >
              <motion.span className="tl-line" variants={{ hidden: { scaleX: 0 }, shown: { scaleX: 1 } }} transition={{ duration: 1, ease: EASE_OUT }} />
              <motion.span className="tl-year" variants={{ hidden: { opacity: 0, x: -30 }, shown: { opacity: 1, x: 0 } }} transition={{ duration: 0.7, ease: EASE_OUT }}>
                {t.year}
              </motion.span>
              <motion.span className="tl-what" variants={{ hidden: { opacity: 0, y: 20 }, shown: { opacity: 1, y: 0 } }} transition={{ duration: 0.7, ease: EASE_OUT }}>
                {t.what}
              </motion.span>
            </motion.li>
          ))}
        </ul>
      </section>

      <section className="skills">
        <SplitText text="What I work with" inView className="h2" italicWords={['work']} />
        <SkillPit />
      </section>

      <NextUp from="about" />
    </div>
  )
}
