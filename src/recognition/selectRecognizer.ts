import type { MicInput } from '../audio/micInput'
import type { NoteRecognizer } from './types'
import { createVoskRecognizer } from './voskRecognizer'
import { createWebSpeechRecognizer, hasWebSpeech } from './webSpeechRecognizer'
import { isModelCached } from './modelStore'
import { preloadModel } from './voskModelCache'

export interface SelectDeps {
  createLocal: (mic: MicInput) => NoteRecognizer
  /** null quando não há Web Speech. */
  createOnline: (mic: MicInput) => NoteRecognizer | null
  isModelCached: () => Promise<boolean>
  deviceMemory?: number
}

const defaultDeps: SelectDeps = {
  createLocal: (mic) => createVoskRecognizer(mic),
  createOnline: (mic) => (hasWebSpeech() ? createWebSpeechRecognizer(mic) : null),
  isModelCached,
  deviceMemory: (navigator as unknown as { deviceMemory?: number }).deviceMemory,
}

/** Mínimo de memória do aparelho (GB) para tentar o motor local. */
const MIN_DEVICE_MEMORY = 2

async function canUseLocal(d: SelectDeps): Promise<boolean> {
  return (d.deviceMemory ?? 4) >= MIN_DEVICE_MEMORY && (await d.isModelCached())
}

/**
 * Aquece o modelo local em segundo plano (ao abrir a Prática), para que o
 * start() da lição só precise criar o KaldiRecognizer.
 */
export function preloadLocalModel(deps: Partial<SelectDeps> & { preload?: () => void } = {}): void {
  const d: SelectDeps = { ...defaultDeps, ...deps }
  const preload = deps.preload ?? preloadModel
  canUseLocal(d).then(
    (ok) => {
      if (ok) preload()
    },
    () => {},
  )
}

function startWithTimeout(rec: NoteRecognizer, timeoutSeconds: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeoutSeconds * 1000)
    rec.start().then(
      () => {
        clearTimeout(timer)
        resolve()
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

export async function selectRecognizer(
  mic: MicInput,
  timeoutSeconds: number,
  deps: Partial<SelectDeps> = {},
): Promise<NoteRecognizer | null> {
  const d: SelectDeps = { ...defaultDeps, ...deps }

  if (await canUseLocal(d)) {
    const local = d.createLocal(mic)
    try {
      await startWithTimeout(local, timeoutSeconds)
      return local
    } catch {
      local.stop()
    }
  }

  const online = d.createOnline(mic)
  if (!online) return null
  try {
    await online.start()
    return online
  } catch {
    online.stop()
    return null
  }
}
