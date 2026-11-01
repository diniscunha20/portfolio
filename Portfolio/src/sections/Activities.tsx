import { useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { activities, type Activity } from '../data'
import { EASE_OUT, ENTER_DELAY } from '../lib/nav'
import { Arrow, Btn } from '../components/Btn'
import { NextUp, PageHeader } from '../components/PageBits'
import { RollText } from '../components/RollText'

const tilt = (i: number) => [-4, 3, -2, 5, -3, 2][i % 6]

/** The top card of the deck: drag it far enough and it gets flung to the back. */
function TopCard({ a, n, onFling }: { a: Activity; n: number; onFling: (dir: number) => void }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 300], [-22, 22])
  const stampNope = useTransform(x, [-140, -40], [1, 0])
  const stampYes = useTransform(x, [40, 140], [0, 1])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 120 || Math.abs(info.velocity.x) > 600) onFling(Math.sign(info.offset.x) || 1)
  }

  return (
    <motion.div
      className="deck-card is-top"
      style={{ x, rotate, zIndex: 10 }}
      drag="x"
      dragSnapToOrigin
      dragElastic={0.9}
      onDragEnd={onDragEnd}
      initial={{ scale: 0.9, y: 30, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      variants={{
        // `dir` comes from AnimatePresence's `custom`, so the exiting card knows which way it was flung
        gone: (dir: number) => ({ x: dir * 600, rotate: dir * 40, opacity: 0, transition: { duration: 0.45, ease: EASE_OUT } }),
      }}
      exit="gone"
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      whileTap={{ cursor: 'grabbing', scale: 1.03 }}
      data-cursor="swipe"
    >
      <CardFace a={a} n={n} />
      <motion.span className="stamp stamp-yes" style={{ opacity: stampYes }}>
        love it
      </motion.span>
      <motion.span className="stamp stamp-nope" style={{ opacity: stampNope }}>
        next!
      </motion.span>
    </motion.div>
  )
}

function CardFace({ a, n }: { a: Activity; n: number }) {
  return (
    <>
      <div className="deck-top">
        <span>{a.kicker}</span>
        <span>
          {String(n).padStart(2, '0')}/{String(activities.length).padStart(2, '0')}
        </span>
      </div>
      <div className="deck-glyph">{a.glyph}</div>
      <div className="deck-bottom">
        <h3>{a.title}</h3>
        <p>{a.text}</p>
      </div>
    </>
  )
}

function Deck() {
  const [order, setOrder] = useState(() => activities.map((_, i) => i))
  const [exitDir, setExitDir] = useState(1)

  const fling = (dir: number) => {
    setExitDir(dir)
    setOrder((o) => [...o.slice(1), o[0]])
  }
  const shuffle = () => setOrder((o) => [...o].sort(() => Math.random() - 0.5))

  return (
    <div className="deck-zone">
      <motion.div
        className="deck"
        initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14, delay: ENTER_DELAY + 0.4 }}
      >
        {order
          .slice(1, 4)
          .reverse()
          .map((idx) => {
            const depth = order.indexOf(idx)
            return (
              <motion.div
                key={idx}
                className="deck-card"
                animate={{ rotate: tilt(idx), y: depth * 14, scale: 1 - depth * 0.04 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                style={{ zIndex: 10 - depth }}
              >
                <CardFace a={activities[idx]} n={idx + 1} />
              </motion.div>
            )
          })}
        <AnimatePresence custom={exitDir}>
          <TopCard key={order[0]} a={activities[order[0]]} n={order[0] + 1} onFling={fling} />
        </AnimatePresence>
      </motion.div>

      <div className="deck-actions">
        <Btn label="Nope, next" onClick={() => fling(-1)} cursor="←" />
        <Btn label="Shuffle" onClick={shuffle} cursor="🎲" />
        <Btn label="Love it" variant="solid" onClick={() => fling(1)} cursor="→" />
      </div>
    </div>
  )
}

const currently = [
  { k: 'Studying', v: "Master's in Software Engineering, UA" },
  { k: 'Learning', v: 'Enterprise architecture and TOGAF' },
  { k: 'Organising', v: 'Taça UA with NEI-AAUv' },
  { k: 'Playing', v: 'Running and padel' },
]

export function Activities() {
  return (
    <div className="page activities">
      <PageHeader id="activities" title="Beyond code" italic={['code']} sub="What I do away from the code. Swipe through the cards." />

      <Deck />

      <section className="currently">
        <h2 className="h2">
          Currently<span className="italic">…</span>
        </h2>
        <ul>
          {currently.map((c, i) => (
            <motion.li
              key={c.k}
              className="currently-row roll-host"
              initial={{ opacity: 0, x: i % 2 ? 60 : -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.8, ease: EASE_OUT, delay: i * 0.06 }}
              data-cursor="yep"
            >
              <span className="currently-k">{c.k}</span>
              <span className="currently-v">
                <RollText text={c.v} />
              </span>
              <Arrow dir="ne" />
            </motion.li>
          ))}
        </ul>
      </section>

      <NextUp from="activities" />
    </div>
  )
}
