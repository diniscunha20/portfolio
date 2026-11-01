/**
 * Letters roll up one after another when any `.roll-host` ancestor is hovered.
 * Pure CSS (see `.roll` in styles.css) so it can live inside anything.
 */
export function RollText({ text, className }: { text: string; className?: string }) {
  const chars = [...text]
  return (
    <span className={`roll ${className ?? ''}`} aria-label={text}>
      {chars.map((c, i) => (
        <span key={i} className="roll-char" style={{ ['--i' as string]: i }} data-char={c === ' ' ? ' ' : c} aria-hidden>
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </span>
  )
}
