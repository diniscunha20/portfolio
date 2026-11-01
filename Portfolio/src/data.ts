// All site content lives here.

export type RouteId = 'home' | 'about' | 'projects' | 'designs' | 'activities' | 'socials'

export type TransitionVariant = 'curtain' | 'stairs' | 'circle' | 'tiles' | 'blinds'

export interface Section {
  id: RouteId
  index: string
  label: string
  title: string
  /** shown on the transition overlay while the page swaps */
  quip: string
  /** every aspect of you gets its own way of arriving */
  transition: TransitionVariant
}

export const YEAR = new Date().getFullYear()

export const profile = {
  firstName: 'Dinis',
  lastName: 'Cunha',
  role: 'Software engineer',
  location: 'Barcelos, Portugal',
  timezone: 'Europe/Lisbon',
  email: 'diniscunha24@gmail.com',
  tagline: 'Software engineering student at the University of Aveiro, into frontend, UI/UX and enterprise architecture.',
}

export const sections: Section[] = [
  { id: 'home', index: '00', label: 'Home', title: 'Index', quip: 'back to the start', transition: 'curtain' },
  { id: 'about', index: '01', label: 'About', title: 'About me', quip: 'a bit about me', transition: 'stairs' },
  { id: 'projects', index: '02', label: 'Projects', title: 'Selected work', quip: 'what I have built', transition: 'circle' },
  { id: 'designs', index: '03', label: 'Designs', title: 'Designs', quip: 'posters and imagery', transition: 'curtain' },
  { id: 'activities', index: '04', label: 'Beyond', title: 'Beyond code', quip: 'away from the screen', transition: 'tiles' },
  { id: 'socials', index: '05', label: 'Contact', title: 'Get in touch', quip: 'say hello', transition: 'blinds' },
]

export const sectionById = Object.fromEntries(sections.map((s) => [s.id, s])) as Record<RouteId, Section>

export const loaderQuips = [
  'Warming up the serifs',
  'Kerning by hand',
  'Teaching pixels to dance',
  'Bribing the browser',
  'Untangling divs',
  'Feeding the hamsters',
  'Almost there (that was a lie)',
  'Okay, actually there',
]

export interface Project {
  id: string
  title: string
  year: string
  category: string
  grade: string
  blurb: string
  tags: string[]
  pattern: 'stripes' | 'dots' | 'rings' | 'grid' | 'waves' | 'checker'
  href?: string
}

export const projects: Project[] = [
  {
    id: 'connecttion',
    title: 'Connecttion',
    year: '2026',
    category: "Bachelor's final project",
    grade: '19/20',
    blurb:
      'A modular ERP for associations. It brings membership management, finances, inventory and mandatory legal reports (RAC, PAAJ) into a single platform. Built security-by-design around core NIS2 requirements, with SAST/DAST, SIEM-based incident detection and OIDC authentication with RBAC, while keeping personal data GDPR compliant. AETTUA was the main case study, and the system was validated by other associations, accountants and domain experts.',
    tags: ['React', 'TypeScript', 'Python', 'PostgreSQL', 'Docker', 'Authentik (OIDC)', 'SonarQube', 'OWASP ZAP'],
    pattern: 'grid',
  },
  {
    id: 'secureshare',
    title: 'SecureShare',
    year: '2025',
    category: 'Information Security project',
    grade: '18/20',
    blurb:
      'A server-blind file transfer system. Files are protected with hybrid encryption (RSA-4096, AES-256/ChaCha20) and every action goes into a tamper-evident audit log for non-repudiation. Access control combines RBAC with a Bell-LaPadula multi-level security model, plus an audited break-glass mechanism for exceptional access.',
    tags: ['Python', 'cryptography.io', 'SQLite', 'SQLAlchemy', 'Argon2id'],
    pattern: 'rings',
  },
]

export interface Design {
  title: string
  year: string
  /** image under public/designs/, e.g. '/designs/taca-ua.jpg'; falls back to a pattern */
  src?: string
  pattern: Project['pattern']
}

export const designs: Design[] = [
  { title: 'Poster 01', year: '2026', pattern: 'stripes' },
  { title: 'Poster 02', year: '2026', pattern: 'dots' },
  { title: 'Poster 03', year: '2025', pattern: 'waves' },
  { title: 'Poster 04', year: '2025', pattern: 'checker' },
]

export interface Activity {
  title: string
  kicker: string
  text: string
  glyph: string
}

export const activities: Activity[] = [
  { title: 'Taça UA', kicker: 'NEI-AAUv', text: 'The largest university-level amateur championship in Portugal, with around 5,000 athletes. I manage the Software Engineering team across every sport.', glyph: '★' },
  { title: 'Sports & Wellbeing', kicker: 'NEI-AAUv', text: 'Board member since 2025, organising sports and wellbeing activities that get people away from their screens.', glyph: '✳' },
  { title: 'Running', kicker: 'Sport', text: 'My go-to way to clear my head.', glyph: '↻' },
  { title: 'Padel', kicker: 'Sport', text: 'One of my favourite sports to play.', glyph: '◐' },
  { title: 'A bit of everything', kicker: 'Sport', text: "Running and padel are the regulars, but I'll play pretty much anything.", glyph: '◎' },
  { title: 'Design', kicker: 'Creative', text: 'Posters and imagery, the other side of my interest in UI.', glyph: '❡' },
]

export const socials = [
  { label: 'LinkedIn', handle: 'in/dinis-cunha', href: 'https://www.linkedin.com/in/dinis-cunha-95bb45206/' },
  { label: 'GitHub', handle: '@diniscunha20', href: 'https://github.com/diniscunha20' },
]

export const timeline = [
  { year: 'Now', what: 'Taking my first steps towards a TOGAF certification' },
  { year: '2026', what: "Started the Master's in Software Engineering at the University of Aveiro" },
  { year: '2026', what: "Finished the Bachelor's in Software Engineering with a final grade of 15, and Connecttion with 19/20" },
  { year: '2025', what: 'Joined the Sports & Wellbeing board at NEI-AAUv' },
  { year: '2023', what: "Started the Bachelor's in Software Engineering at the University of Aveiro" },
]
