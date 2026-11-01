import { Fragment } from 'react'
import { motion } from 'motion/react'
import { EASE_OUT } from '../lib/nav'

interface Props {
  text: string
  by?: 'char' | 'word'
  delay?: number
  stagger?: number
  className?: string
  /** play when scrolled into view instead of on mount */
  inView?: boolean
  italicWords?: string[]
}

/** Each word / letter slides up out of its own mask with a little tilt. */
export function SplitText({ text, by = 'word', delay = 0, stagger, className, inView, italicWords = [] }: Props) {
  const words = text.split(' ')
  const step = stagger ?? (by === 'char' ? 0.03 : 0.06)
  let n = 0

  const hidden = { y: '115%', rotate: by === 'char' ? 12 : 4 }
  const shown = { y: '0%', rotate: 0 }
  const trigger = inView
    ? { whileInView: shown, viewport: { once: true, margin: '-10% 0px' } }
    : { animate: shown }

  return (
    <span className={`split ${className ?? ''}`} aria-label={text}>
      {words.map((word, wi) => {
        const italic = italicWords.includes(word.replace(/[^\p{L}]/gu, ''))
        const units = by === 'char' ? [...word] : [word]
        return (
          <Fragment key={wi}>
            <span className={`split-word${italic ? ' italic' : ''}`} aria-hidden>
              {units.map((u, ui) => (
                <span key={ui} className="mask">
                  <motion.span
                    className="split-unit"
                    initial={hidden}
                    {...trigger}
                    transition={{ duration: 0.9, ease: EASE_OUT, delay: delay + n++ * step }}
                  >
                    {u}
                  </motion.span>
                </span>
              ))}
            </span>
            {wi < words.length - 1 && ' '}
          </Fragment>
        )
      })}
    </span>
  )
}
