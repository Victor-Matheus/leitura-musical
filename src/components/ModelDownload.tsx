import { useEffect, useState } from 'react'
import { CheckCircle2, Download } from 'lucide-react'
import { Button, Card, IconBox } from './ui'
import { downloadModel, isModelCached } from '../recognition/modelStore'
import { preloadLocalModel } from '../recognition/selectRecognizer'

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
      // Carrega já, com rede: o worker grava o modelo no IDBFS para uso offline.
      preloadLocalModel()
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'checking' || status === 'cached') return null

  return (
    <Card className="flex flex-col gap-2 !p-4">
      {status === 'done' ? (
        <div className="flex items-center gap-3">
          <IconBox icon={CheckCircle2} />
          <p className="text-lg font-bold" style={{ color: 'var(--success)' }}>
            Motor de voz pronto para uso offline
          </p>
        </div>
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
            <Button icon={Download} className="self-start" onClick={onDownload}>
              Baixar motor de voz (≈ 30 MB)
            </Button>
          )}
          {status === 'error' && (
            <p className="text-base" style={{ color: 'var(--error)' }}>
              Não foi possível baixar o motor de voz. Verifique a conexão e tente de novo.
            </p>
          )}
        </>
      )}
    </Card>
  )
}
