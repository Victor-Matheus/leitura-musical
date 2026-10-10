import { AppIcon } from './AppIcon'

interface SplashScreenProps {
  exiting: boolean
}

export function SplashScreen({ exiting }: SplashScreenProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 ${
        exiting ? 'animate-splash-exit' : ''
      }`}
      style={{ background: 'var(--surface-dark)' }}
      aria-hidden="true"
    >
      <div className="animate-splash-pop">
        <AppIcon size={96} />
      </div>
      <h1 className="animate-splash-fade text-3xl font-extrabold" style={{ color: 'var(--on-dark)' }}>
        Leitura Musical
      </h1>
      <p className="animate-splash-fade text-base" style={{ color: 'var(--accent)' }}>
        Afinando o ouvido...
      </p>
    </div>
  )
}
