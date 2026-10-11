import { useEffect, useLayoutEffect, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { Settings as SettingsIcon } from 'lucide-react'
import { AppIcon } from './components/AppIcon'
import { AccessibilityBar } from './components/AccessibilityBar'
import { SplashScreen } from './components/SplashScreen'
import { usePracticeStore } from './store/usePracticeStore'
import { Diagnostico } from './routes/Diagnostico'
import { Exercise } from './routes/Exercise'
import { Home } from './routes/Home'
import { Hymns } from './routes/Hymns'
import { HymnEditor } from './routes/HymnEditor'
import { Lesson } from './routes/Lesson'
import { Practice } from './routes/Practice'
import { Results } from './routes/Results'
import { Settings } from './routes/Settings'
import { Theory } from './routes/Theory'

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

  // Layout effect: as classes de tema precisam estar no <html> antes dos efeitos dos filhos
  // (ex.: NoteStaff lê as cores via readToken ao desenhar a pauta).
  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('font-grande', fontSize === 'grande')
    root.classList.toggle('font-enorme', fontSize === 'enorme')
    root.classList.toggle('theme-contrast', highContrast)
  }, [fontSize, highContrast])

  return (
    <div>
      {showSplash && <SplashScreen exiting={splashExiting} />}
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 py-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-[var(--text)] sm:text-2xl"
          >
            <AppIcon size={36} />
            <span>Leitura Musical</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <AccessibilityBar />
            <Link
              to="/configuracoes"
              aria-label="Configurações"
              title="Configurações"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--primary)] transition-all hover:bg-[var(--bg)] active:scale-[0.98]"
            >
              <SettingsIcon size={22} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/praticar" element={<Practice />} />
            <Route path="/resultado" element={<Results />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="/diagnostico" element={<Diagnostico />} />
            <Route path="/teoria" element={<Theory />} />
            <Route path="/teoria/:lessonId" element={<Lesson />} />
            <Route path="/teoria/:lessonId/exercicio/:exerciseId" element={<Exercise />} />
            <Route path="/hinos" element={<Hymns />} />
            <Route path="/hinos/novo" element={<HymnEditor />} />
            <Route path="/hinos/:id/editar" element={<HymnEditor />} />
          </Routes>
        </main>

        <footer className="py-6 text-center text-sm text-[var(--muted)]">
          Treine a leitura de notas no seu ritmo.
        </footer>
      </div>
    </div>
  )
}
