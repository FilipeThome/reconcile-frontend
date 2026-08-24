type BarFillProps = {
  pct: number
}

export function BarFill({ pct }: BarFillProps) {
  const width = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0))
  return (
    <svg className="bar-fill-svg" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden>
      <rect width={width} height="8" rx="4" />
    </svg>
  )
}
