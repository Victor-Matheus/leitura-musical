import { useEffect, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { AccessibilityBar } from './components/AccessibilityBar'
import { SplashScreen } from './components/SplashScreen'
import { usePracticeStore } from './store/usePracticeStore'
import { Home } from './routes/Home'
import { Practice } from './routes/Practice'
import { Results } from './routes/Results'
import { Settings } from './routes/Settings'

export default function App() {
  const { fontSize, highContrast } = usePracticeStore((s) => s.settings)

  const [showSplash, setShowSplash] = useState(true)
  const [splashExiting, setSplashExiting] = useState(false)

  useEffect(() => {
    const exitTimer = setTimeout(() => setSplashExiting(true), 1200)
    const hideTimer = setTimeout(() => setShowSplash(false), 1550)
    return () => {
      clearTimeout(exitTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('font-grande', fontSize === 'grande')
    root.classList.toggle('font-enorme', fontSize === 'enorme')
    root.classList.toggle('theme-contrast', highContrast)
  }, [fontSize, highContrast])

  return (
    <div>
      {showSplash && <SplashScreen exiting={splashExiting} />}
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4">
        <header className="flex items-center justify-between gap-4 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-extrabold"
            style={{ color: 'var(--text)' }}
          >
            🎼 <span>Leitura Musical</span>
          </Link>
          <div className="flex items-center gap-2">
            <AccessibilityBar />
            <Link
              to="/configuracoes"
              aria-label="Configurações"
              title="Configurações"
              className="rounded-xl p-2 transition hover:scale-105"
              style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3 13.09H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/praticar" element={<Practice />} />
            <Route path="/resultado" element={<Results />} />
            <Route path="/configuracoes" element={<Settings />} />
          </Routes>
        </main>

        <footer className="py-4 text-center text-sm" style={{ color: 'var(--muted)' }}>
          Treine a leitura de notas no seu ritmo.
        </footer>
      </div>
    </div>
  )
}
