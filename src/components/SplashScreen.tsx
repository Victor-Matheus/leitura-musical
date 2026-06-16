interface SplashScreenProps {
  exiting: boolean
}

export function SplashScreen({ exiting }: SplashScreenProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 ${
        exiting ? 'animate-splash-exit' : ''
      }`}
      style={{ background: 'var(--bg)' }}
      aria-hidden="true"
    >
      <div className="animate-splash-pop text-7xl">🎼</div>
      <h1 className="animate-splash-fade text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
        Leitura Musical
      </h1>
      <p className="animate-splash-fade text-base" style={{ color: 'var(--muted)' }}>
        Afinando o ouvido...
      </p>
    </div>
  )
}
