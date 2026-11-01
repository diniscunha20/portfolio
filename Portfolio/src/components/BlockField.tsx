import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

/** Must match `--cell` in styles.css so blocks sit exactly on the grid lines. */
export const CELL = 72

type Kind = 'solid' | 'hatch' | 'dot'
interface Block {
  id: number
  c: number
  r: number
  kind: Kind
}

const KINDS: Kind[] = ['solid', 'hatch', 'solid', 'dot', 'hatch']

const dims = () => ({ cols: Math.ceil(window.innerWidth / CELL), rows: Math.ceil(window.innerHeight / CELL) })

function seed(): Block[] {
  const { cols, rows } = dims()
  const count = Math.max(6, Math.round(cols * rows * 0.045))
  const taken = new Set<string>()
  return Array.from({ length: count }, (_, id) => {
    let c = 0
    let r = 0
    do {
      c = Math.floor(Math.random() * cols)
      r = Math.floor(Math.random() * rows)
    } while (taken.has(`${c},${r}`))
    taken.add(`${c},${r}`)
    return { id, c, r, kind: KINDS[id % KINDS.length] }
  })
}

/** Pick a free neighbouring cell (4-way), or stay put if boxed in. */
function hop(b: Block, all: Block[]): Block {
  const { cols, rows } = dims()
  const options = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
    .map(([dc, dr]) => ({ c: b.c + dc, r: b.r + dr }))
    .filter(({ c, r }) => c >= 0 && r >= 0 && c < cols && r < rows && !all.some((o) => o.c === c && o.r === r))
  if (!options.length) return b
  return { ...b, ...options[Math.floor(Math.random() * options.length)] }
}

/**
 * Grey blocks parked on the background grid. Every so often one shuffles to a
 * neighbouring cell, and any block the cursor lands on scoots out of the way.
 */
export function BlockField() {
  const [blocks, setBlocks] = useState(seed)

  useEffect(() => {
    const idle = window.setInterval(() => {
      setBlocks((bs) => {
        const i = Math.floor(Math.random() * bs.length)
        return bs.map((b, j) => (j === i ? hop(b, bs) : b))
      })
    }, 1600)

    let lastCell = ''
    const move = (e: PointerEvent) => {
      const c = Math.floor(e.clientX / CELL)
      const r = Math.floor(e.clientY / CELL)
      const key = `${c},${r}`
      if (key === lastCell) return
      lastCell = key
      setBlocks((bs) => (bs.some((b) => b.c === c && b.r === r) ? bs.map((b) => (b.c === c && b.r === r ? hop(b, bs) : b)) : bs))
    }

    const resize = () => setBlocks(seed())

    window.addEventListener('pointermove', move)
    window.addEventListener('resize', resize)
    return () => {
      window.clearInterval(idle)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="block-field" aria-hidden>
      {blocks.map((b, i) => (
        <motion.span
          key={b.id}
          className={`bf-block bf-${b.kind}`}
          initial={{ x: b.c * CELL, y: b.r * CELL, scale: 0 }}
          animate={{ x: b.c * CELL, y: b.r * CELL, scale: 1 }}
          transition={{
            x: { type: 'spring', stiffness: 260, damping: 22 },
            y: { type: 'spring', stiffness: 260, damping: 22 },
            scale: { type: 'spring', stiffness: 300, damping: 18, delay: 0.6 + i * 0.05 },
          }}
        />
      ))}
    </div>
  )
}
