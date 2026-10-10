import type { MicInput } from '../audio/micInput'
import type { NoteRecognizer } from './types'
import { createVoskRecognizer } from './voskRecognizer'
import { createWebSpeechRecognizer, hasWebSpeech } from './webSpeechRecognizer'
import { isModelCached } from './modelStore'

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

  if ((await d.isModelCached()) && (d.deviceMemory ?? 4) >= 2) {
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
