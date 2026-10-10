interface BeatPulseProps {
  beat: number
  active: boolean
}

/** Círculo que pisca a cada mudança de `beat`. */
export function BeatPulse({ beat, active }: BeatPulseProps) {
  if (!active) return null
  return (
    <span
      key={beat}
      data-testid="beat-pulse"
      aria-hidden="true"
      className="animate-pop inline-block h-5 w-5 rounded-full"
      style={{ background: 'var(--primary)' }}
    />
  )
}
