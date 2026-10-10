interface SpeedControlProps {
  bpm: number
  onChange: (bpm: number) => void
  disabled?: boolean
}

export function SpeedControl({ bpm, onChange, disabled = false }: SpeedControlProps) {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor="bpm" className="text-lg font-semibold text-[var(--text)]">
          Velocidade
        </label>
        <span className="text-lg font-bold tabular-nums text-[var(--primary)]">{bpm} BPM</span>
      </div>
      <input
        id="bpm"
        type="range"
        min={30}
        max={120}
        step={5}
        value={bpm}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-3 w-full cursor-pointer appearance-none rounded-full bg-[var(--border)] accent-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="mt-1 flex justify-between text-sm text-[var(--muted)]">
        <span>Devagar</span>
        <span>Rápido</span>
      </div>
    </div>
  )
}
