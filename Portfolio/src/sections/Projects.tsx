import { useCallback, useEffect, useState, type MouseEvent } from 'react'
import { AnimatePresence, LayoutGroup, motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { projects, type Project } from '../data'
import { EASE_OUT, ENTER_DELAY } from '../lib/nav'
import { Arrow, Btn } from '../components/Btn'
import { NextUp, PageHeader } from '../components/PageBits'

/** Generative black & white cover art — stand-in until real screenshots exist. */
function Cover({ p }: { p: Project }) {
  return <div className={`cover cover-${p.pattern}`} />
}

function Card({ p, i, delay, onOpen }: { p: Project; i: number; delay: number; onOpen: () => void }) {
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(my, [0, 1], [8, -8]), { stiffness: 200, damping: 18 })
  const rotateY = useSpring(useTransform(mx, [0, 1], [-10, 10]), { stiffness: 200, damping: 18 })
  const glareX = useTransform(mx, [0, 1], ['0%', '100%'])
  const glareY = useTransform(my, [0, 1], ['0%', '100%'])

  const onMove = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width)
    my.set((e.clientY - r.top) / r.height)
  }
  const reset = () => {
    mx.set(0.5)
    my.set(0.5)
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 80, rotate: i % 2 ? 3 : -3 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.8, filter: 'blur(8px)' }}
      transition={{ duration: 0.8, ease: EASE_OUT, delay, layout: { duration: 0.6, ease: EASE_OUT } }}
      className="card-wrap"
    >
      <motion.button
        layoutId={`card-${p.id}`}
        className="card"
        onClick={onOpen}
        onMouseMove={onMove}
        onMouseLeave={reset}
        style={{ rotateX, rotateY, transformPerspective: 900 }}
        whileTap={{ scale: 0.96 }}
        data-cursor="open"
      >
        <motion.div layoutId={`cover-${p.id}`} className="card-cover">
          <Cover p={p} />
          <motion.span className="glare" style={{ left: glareX, top: glareY }} />
        </motion.div>
        <div className="card-meta">
          <motion.span layoutId={`title-${p.id}`} className="card-title">
            {p.title}
          </motion.span>
          <span className="card-year">{p.year}</span>
        </div>
        <div className="card-tags">
          <span>{p.category}</span>
          <span className="card-arrow">
            <Arrow />
          </span>
        </div>
      </motion.button>
    </motion.li>
  )
}

function Detail({ p, onClose }: { p: Project; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <>
      <motion.div className="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} data-cursor="close" />
      <motion.article layoutId={`card-${p.id}`} className="detail" role="dialog" aria-modal aria-label={p.title} transition={{ duration: 0.65, ease: EASE_OUT }}>
        <motion.div layoutId={`cover-${p.id}`} className="detail-cover">
          <Cover p={p} />
        </motion.div>
        <div className="detail-body">
          <motion.h2 layoutId={`title-${p.id}`} className="detail-title">
            {p.title}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.35, duration: 0.6, ease: EASE_OUT } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            <p className="detail-meta">
              {p.category} — {p.year} — {p.grade}
            </p>
            <p className="detail-blurb">{p.blurb}</p>
            <ul className="detail-tags">
              {p.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <div className="detail-actions">
              {p.href && <Btn label="Visit project" variant="solid" icon={<Arrow />} href={p.href} cursor="visit" />}
              <Btn label="Close" onClick={onClose} cursor="bye" />
            </div>
          </motion.div>
        </div>
      </motion.article>
    </>
  )
}

export function Projects() {
  const [open, setOpen] = useState<Project | null>(null)
  const close = useCallback(() => setOpen(null), [])

  return (
    <div className="page projects">
      <PageHeader id="projects" title="Selected work" italic={['work']} sub="Two projects from my bachelor's. Click one to read more. Everything else is on LinkedIn." />

      <LayoutGroup>
        <motion.ul className="grid" layout>
          <AnimatePresence mode="popLayout">
            {projects.map((p, i) => (
              <Card key={p.id} p={p} i={i} delay={ENTER_DELAY + 0.4 + i * 0.07} onOpen={() => setOpen(p)} />
            ))}
          </AnimatePresence>
        </motion.ul>

        <AnimatePresence>{open && <Detail p={open} onClose={close} />}</AnimatePresence>
      </LayoutGroup>

      <NextUp from="projects" />
    </div>
  )
}
