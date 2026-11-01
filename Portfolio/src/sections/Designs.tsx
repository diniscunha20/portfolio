import { motion } from 'motion/react'
import { designs } from '../data'
import { EASE_OUT, ENTER_DELAY } from '../lib/nav'
import { NextUp, PageHeader } from '../components/PageBits'

export function Designs() {
  return (
    <div className="page designs">
      <PageHeader id="designs" title="Designs" italic={['Designs']} sub="Some of the posters and imagery I've made." />

      <ul className="design-grid">
        {designs.map((d, i) => (
          <motion.li
            key={d.title}
            className="design"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: ENTER_DELAY + 0.4 + i * 0.07 }}
          >
            <div className="design-frame">
              {d.src ? <img src={d.src} alt={d.title} loading="lazy" /> : <div className={`cover cover-${d.pattern}`} />}
            </div>
            <div className="card-meta">
              <span className="design-title">{d.title}</span>
              <span className="card-year">{d.year}</span>
            </div>
          </motion.li>
        ))}
      </ul>

      <NextUp from="designs" />
    </div>
  )
}
