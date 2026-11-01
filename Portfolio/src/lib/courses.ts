// Mini-golf holes for the loader. Logical units; the canvas scales them to fit.
export const W = 600
export const H = 330
export const HOLE_R = 12

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** A block that oscillates along one axis (drawn hatched). `travel` is how far it sweeps. */
interface Mover extends Rect {
  axis: 'x' | 'y'
  travel: number
  speed: number
  phase?: number
}

export interface Course {
  name: string
  par: number
  tee: { x: number; y: number }
  hole: { x: number; y: number }
  walls: Rect[]
  movers: Mover[]
}

export const COURSES: Course[] = [
  {
    name: 'The Needle',
    par: 3,
    tee: { x: 80, y: H / 2 },
    hole: { x: 525, y: H / 2 },
    // a wall with a gap you have to thread, then a block sliding in front of the cup
    walls: [
      { x: 270, y: 0, w: 24, h: 190 },
      { x: 270, y: 252, w: 24, h: H - 252 },
    ],
    movers: [{ x: 420, y: 24, w: 24, h: 92, axis: 'y', travel: H - 48 - 92, speed: 1.3 }],
  },
  {
    name: 'Zig Zag',
    par: 3,
    tee: { x: 60, y: 270 },
    hole: { x: 540, y: 60 },
    walls: [
      { x: 170, y: 0, w: 22, h: 220 },
      { x: 300, y: 110, w: 22, h: H - 110 },
      { x: 430, y: 0, w: 22, h: 220 },
    ],
    movers: [],
  },
  {
    name: 'The Crusher',
    par: 3,
    tee: { x: 70, y: H / 2 },
    hole: { x: 530, y: H / 2 },
    // two blocks pumping out of phase: wait for the window
    walls: [],
    movers: [
      { x: 230, y: 20, w: 26, h: 120, axis: 'y', travel: H - 40 - 120, speed: 1.6 },
      { x: 360, y: 20, w: 26, h: 120, axis: 'y', travel: H - 40 - 120, speed: 1.6, phase: Math.PI },
    ],
  },
  {
    name: 'Back Door',
    par: 4,
    tee: { x: 70, y: H / 2 },
    hole: { x: 505, y: H / 2 },
    // the cup sits in a box that only opens at the back
    walls: [
      { x: 440, y: 105, w: 110, h: 18 },
      { x: 440, y: H - 123, w: 110, h: 18 },
      { x: 440, y: 105, w: 18, h: H - 210 },
    ],
    movers: [{ x: 290, y: 20, w: 22, h: 90, axis: 'y', travel: H - 40 - 90, speed: 1.1 }],
  },
  {
    name: 'Pinball',
    par: 3,
    tee: { x: 300, y: 290 },
    hole: { x: 300, y: 66 },
    // a lid right over the cup: bank it off the side walls
    walls: [
      { x: 230, y: 130, w: 140, h: 22 },
      { x: 80, y: 200, w: 22, h: 130 },
      { x: 498, y: 200, w: 22, h: 130 },
    ],
    movers: [{ x: 40, y: 70, w: 22, h: 60, axis: 'x', travel: 130, speed: 1.4 }],
  },
]

export const randomCourse = () => COURSES[Math.floor(Math.random() * COURSES.length)]

export const moverPos = (m: Mover, t: number) => {
  const off = m.travel * (0.5 + 0.5 * Math.sin(t * m.speed + (m.phase ?? 0)))
  return m.axis === 'x' ? { x: m.x + off, y: m.y, w: m.w, h: m.h } : { x: m.x, y: m.y + off, w: m.w, h: m.h }
}

