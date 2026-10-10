import { Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from './ui'

interface TransportControlsProps {
  playing: boolean
  started: boolean
  /** Lição terminada, aguardando a última resposta antes do resultado: nada a acionar. */
  finished: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onRestart: () => void
}

export function TransportControls({
  playing,
  started,
  finished,
  onStart,
  onPause,
  onResume,
  onRestart,
}: TransportControlsProps) {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-3">
      {playing || finished ? (
        <Button
          variant="primary"
          size="lg"
          icon={Pause}
          onClick={onPause}
          disabled={finished}
          className="min-w-40"
        >
          Pausar
        </Button>
      ) : (
        <Button
          variant="primary"
          size="lg"
          icon={Play}
          onClick={started ? onResume : onStart}
          className="min-w-40"
        >
          {started ? 'Continuar' : 'Começar'}
        </Button>
      )}

      <Button
        variant="secondary"
        size="lg"
        icon={RotateCcw}
        onClick={onRestart}
        disabled={finished}
        className="min-w-40"
      >
        Reiniciar
      </Button>
    </div>
  )
}
