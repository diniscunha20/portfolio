import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { profile, socials } from '../data'
import { EASE_OUT, ENTER_DELAY } from '../lib/nav'
import { Arrow } from '../components/Btn'
import { Eyes, Scramble } from '../components/Fun'
import { NextUp, PageHeader } from '../components/PageBits'
import { RollText } from '../components/RollText'

function Confetti() {
  const [bits] = useState(() =>
    Array.from({ length: 18 }, (_, i) => {
      const a = (i / 18) * Math.PI * 2
      const d = 90 + Math.random() * 90
      return { x: Math.cos(a) * d, y: Math.sin(a) * d + 40, rotate: Math.random() * 360, duration: 0.9 + Math.random() * 0.4 }
    }),
  )
  return (
    <div className="confetti" aria-hidden>
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className={i % 3 ? 'bit' : 'bit bit-ring'}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: b.x, y: b.y, scale: 0, opacity: 0, rotate: b.rotate }}
          transition={{ duration: b.duration, ease: EASE_OUT }}
        />
      ))}
    </div>
  )
}

/** Copy-to-clipboard email with a little confetti pop. */
function EmailCopy() {
  const [copied, setCopied] = useState(0)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
    } catch {
      /* clipboard can be blocked; the party happens anyway */
    }
    setCopied((c) => c + 1)
  }

  return (
    <div className="email-wrap">
      <motion.button
        className="email roll-host"
        onClick={copy}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE_OUT, delay: ENTER_DELAY + 0.5 }}
        data-cursor="copy"
      >
        <RollText text={profile.email} />
      </motion.button>
      <div className="email-status mask">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={copied ? `c${copied}` : 'idle'}
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
          >
            {copied ? 'Copied to clipboard' : 'Click to copy'}
          </motion.span>
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {copied > 0 && (
          <Confetti key={copied} />
        )}
      </AnimatePresence>
    </div>
  )
}

function SocialRow({ s, i }: { s: (typeof socials)[number]; i: number }) {
  const [hover, setHover] = useState(0)
  return (
    <motion.li
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: EASE_OUT, delay: i * 0.07 }}
    >
      <a className="social-row" href={s.href} target="_blank" rel="noreferrer" onMouseEnter={() => setHover((h) => h + 1)} data-cursor="visit">
        <span className="index-fill" />
        <span className="social-label">
          <Scramble text={s.label} trigger={hover} />
        </span>
        <span className="social-handle">{s.handle}</span>
        <span className="social-arrow">
          <Arrow />
        </span>
      </a>
    </motion.li>
  )
}

export function Socials() {
  return (
    <div className="page socials">
      <PageHeader id="socials" title="Get in touch" italic={['touch']} sub="Email or LinkedIn is the best way to reach me." />

      <section className="contact">
        <EmailCopy />
        <motion.div
          className="status"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: ENTER_DELAY + 0.8 }}
        >
          <span className="pulse" />
          Open to opportunities
        </motion.div>
      </section>

      <section className="social-list">
        <div className="index-head">
          <h2 className="h2">
            Elsewhere <span className="italic">online</span>
          </h2>
          <Eyes size={34} />
        </div>
        <ul>
          {socials.map((s, i) => (
            <SocialRow key={s.label} s={s} i={i} />
          ))}
        </ul>
      </section>

      <NextUp from="socials" />
    </div>
  )
}
