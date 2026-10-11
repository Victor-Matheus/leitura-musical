interface BeatPulseProps {
  beat: number
  active: boolean
}

/** Círculo que pisca a cada mudança de `beat`. O espaço fica reservado mesmo parado. */
export function BeatPulse({ beat, active }: BeatPulseProps) {
  return (
    <span aria-hidden="true" className="inline-flex h-6 w-6 items-center justify-center">
      {active && (
        <span
          key={beat}
          data-testid="beat-pulse"
          className="animate-pop inline-block h-6 w-6 rounded-full bg-[var(--accent)] ring-4 ring-[var(--accent-soft)]"
        />
      )}
    </span>
  )
}
