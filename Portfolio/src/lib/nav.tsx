import { createContext, useContext, useEffect, useState } from 'react'
import type { RouteId } from '../data'

export interface Point {
  x: number
  y: number
}

interface NavContextValue {
  route: RouteId
  /** navigate to a section; `origin` is where the click happened (transitions grow from there) */
  go: (to: RouteId, origin?: Point) => void
  busy: boolean
}

export const NavContext = createContext<NavContextValue>({
  route: 'home',
  go: () => {},
  busy: false,
})

export const useNav = () => useContext(NavContext)

export const pointFromEvent = (e: { clientX: number; clientY: number }): Point => ({
  x: e.clientX,
  y: e.clientY,
})

/** Seconds that first-fold animations wait so they play as the overlay lifts. */
export const ENTER_DELAY = 0.55

export const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const
export const EASE_OUT = [0.16, 1, 0.3, 1] as const

export function useClock(timeZone: string) {
  const fmt = () => new Date().toLocaleTimeString('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const [t, setT] = useState(fmt)
  useEffect(() => {
    const id = window.setInterval(() => setT(fmt()), 1000)
    return () => window.clearInterval(id)
  })
  return t
}
