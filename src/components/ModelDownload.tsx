import { useEffect, useState } from 'react'
import { downloadModel, isModelCached } from '../recognition/modelStore'

type Status = 'checking' | 'idle' | 'downloading' | 'done' | 'error' | 'cached'

/** Baixa o motor de voz local para uso offline. Some se o modelo já está em cache. */
export function ModelDownload() {
  const [status, setStatus] = useState<Status>('checking')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let alive = true
    isModelCached()
      .then((cached) => alive && setStatus(cached ? 'cached' : 'idle'))
      .catch(() => alive && setStatus('idle'))
    return () => {
      alive = false
    }
  }, [])

  const onDownload = async () => {
    setProgress(0)
    setStatus('downloading')
    try {
      await downloadModel(setProgress)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'checking' || status === 'cached') return null

  return (
    <div
      className="flex flex-col gap-2 rounded-2xl p-4"
      style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
    >
      {status === 'done' ? (
        <p className="text-lg font-bold" style={{ color: 'var(--success)' }}>
          Motor de voz pronto para uso offline
        </p>
      ) : (
        <>
          {status === 'downloading' ? (
            <progress
              value={progress}
              max={1}
              aria-label="Progresso do download"
              className="h-3 w-full"
              style={{ accentColor: 'var(--primary)' }}
            />
          ) : (
            <button
              onClick={onDownload}
              className="self-start rounded-2xl px-5 py-3 text-lg font-bold"
              style={{ background: 'var(--primary)', color: '#fff' }}
            >
              Baixar motor de voz (≈ 30 MB)
            </button>
          )}
          {status === 'error' && (
            <p className="text-base" style={{ color: 'var(--error)' }}>
              Não foi possível baixar o motor de voz. Verifique a conexão e tente de novo.
            </p>
          )}
        </>
      )}
    </div>
  )
}
