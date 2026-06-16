interface TransportControlsProps {
  playing: boolean
  started: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onRestart: () => void
}

const btn =
  'flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-xl font-bold transition active:scale-95'

export function TransportControls({
  playing,
  started,
  onStart,
  onPause,
  onResume,
  onRestart,
}: TransportControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {!playing ? (
        <button
          className={btn}
          style={{ background: 'var(--primary)', color: '#fff' }}
          onClick={started ? onResume : onStart}
        >
          ▶ {started ? 'Continuar' : 'Começar'}
        </button>
      ) : (
        <button
          className={btn}
          style={{ background: 'var(--primary-strong)', color: '#fff' }}
          onClick={onPause}
        >
          ⏸ Pausar
        </button>
      )}

      <button
        className={btn}
        style={{
          background: 'var(--surface)',
          color: 'var(--text)',
          border: '2px solid var(--border)',
        }}
        onClick={onRestart}
      >
        ↺ Reiniciar
      </button>
    </div>
  )
}
