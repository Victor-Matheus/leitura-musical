interface SpeedControlProps {
  bpm: number
  onChange: (bpm: number) => void
}

export function SpeedControl({ bpm, onChange }: SpeedControlProps) {
  return (
    <div className="w-full max-w-md">
      <div className="mb-1 flex items-baseline justify-between">
        <label htmlFor="bpm" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Velocidade
        </label>
        <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--primary)' }}>
          {bpm} BPM
        </span>
      </div>
      <input
        id="bpm"
        type="range"
        min={30}
        max={120}
        step={5}
        value={bpm}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-3 w-full cursor-pointer appearance-none rounded-full"
        style={{ accentColor: 'var(--primary)', background: 'var(--border)' }}
      />
      <div className="mt-1 flex justify-between text-sm" style={{ color: 'var(--muted)' }}>
        <span>Devagar</span>
        <span>Rápido</span>
      </div>
    </div>
  )
}
