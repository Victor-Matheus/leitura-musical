# Motor de reconhecimento de notas — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o motor de voz atual por um que atribui cada sílaba falada à nota que estava na tela no momento da fala, com reconhecimento local (Vosk) e plano B (Web Speech).

**Architecture:** Relógio único (`AudioContext.currentTime`). Um detector de início de fala no aparelho dá o horário de cada sílaba; o reconhecedor (Vosk ou Web Speech) dá só o nome. Um alinhador casa os dois pela ordem. `timeline` e `scorer` são funções puras que decidem a qual nota cada sílaba pertence.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Zustand 5, Vitest + jsdom + Testing Library, vosk-browser 0.0.8.

**Spec:** `docs/superpowers/specs/2026-10-09-motor-reconhecimento-design.md`

## Global Constraints

- Sem backend: tudo client-side. O modelo é servido de `public/models/vosk-pt-small.tar.gz` no próprio domínio.
- Tempo sempre em **segundos** no relógio único (`Clock.now()`), nunca `Date.now()` em lógica de sincronia.
- Texto de interface em pt-BR.
- `tsconfig` tem `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` e `verbatimModuleSyntax`: sem `enum`, sem parameter properties; use `import type` para tipos.
- `vosk-browser` só por `import()` dinâmico (o pacote tem 5,5 MB), nunca import estático.
- Commits sem linha `Co-Authored-By`. Ao commitar, use `git add` só com os arquivos da sua tarefa (outras tarefas podem estar rodando em paralelo); se aparecer `index.lock`, espere 2 s e tente de novo.
- `npm test`, `npm run lint` e `npm run build` devem passar ao fim de cada tarefa.
- Tolerância de antecipação `L = min(0.15, 0.25 × 60/bpm)`; contagem de entrada de 4 tempos; espera final de 1,5 s.

## Review Focus

1. **Andamento rápido (120 BPM, colcheias de 250 ms):** sílabas quase coladas devem gerar um início cada. Teste em Task 4 (`onsetDetector` separa rajadas com 80 ms de silêncio).
2. **Ruído curto (tosse, batida na mesa):** não pode gerar início que "roube" o nome da sílaba seguinte. Teste em Task 4 (rajada de 30 ms não gera início).
3. **Nota repetida (dó, dó):** o Web Speech entrega "dó dó" no mesmo resultado; precisam sair duas sílabas. Teste em Task 6.
4. **Revisão de parcial pelo Web Speech** ("sol lá" vira final "sola"): não pode emitir sílabas extras. Teste em Task 6.
5. **Reiniciar no meio da lição:** sílabas atrasadas da execução anterior não podem pontuar na nova. Teste em Task 11.

---

## Ondas de execução

| Onda | Tarefas (paralelas dentro da onda) |
|---|---|
| 1 | Task 1 |
| 2 | Task 2, Task 3, Task 4, Task 5 |
| 3 | Task 6, Task 7, Task 8 |
| 4 | Task 9, Task 10 |
| 5 | Task 11 |
| 6 | Task 12 |
| 7 | Task 13 |

---

### Task 1: Base de testes e tipos compartilhados

**Files:**
- Modify: `package.json`, `vite.config.ts`, `tsconfig.app.json`
- Create: `src/engine/clock.ts`, `src/recognition/types.ts`, `src/test/setup.ts`, `src/engine/clock.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // src/engine/clock.ts
  export interface Clock { now(): number }            // segundos
  export function audioClock(ctx: AudioContext): Clock // ctx.currentTime
  export const performanceClock: Clock                 // performance.now() / 1000

  // src/recognition/types.ts
  import type { Step } from '../data/notes'
  export interface SyllableEvent { step: Step; onset: number; arrivedAt: number }
  export type RecognizerStatus = 'idle' | 'loading' | 'ready' | 'error'
  export type RecognizerKind = 'local' | 'online'
  export type RecognizerError = 'denied' | 'unsupported' | 'load-failed' | 'crashed'
  export interface NoteRecognizer {
    readonly kind: RecognizerKind
    readonly status: RecognizerStatus
    start(): Promise<void>               // rejeita com Error(message: RecognizerError)
    stop(): void
    onSyllable(cb: (e: SyllableEvent) => void): () => void   // retorna unsubscribe
    onStatus(cb: (s: RecognizerStatus, err?: RecognizerError) => void): () => void
  }
  ```

- [ ] **Step 1:** Instalar dependências: `npm i vosk-browser@0.0.8` e `npm i -D vitest jsdom @testing-library/react @testing-library/dom fflate tar`. Adicionar script `"test": "vitest run"`.
- [ ] **Step 2:** Em `vite.config.ts`, adicionar bloco `test: { environment: 'jsdom', setupFiles: ['src/test/setup.ts'] }` (com `/// <reference types="vitest/config" />`). Em `tsconfig.app.json`, adicionar `"vitest/globals"` não é necessário; importe de `vitest` explicitamente nos testes.
- [ ] **Step 3: Teste que falha** em `src/engine/clock.test.ts`:
  ```ts
  test('audioClock lê currentTime do contexto', () => {
    const ctx = { currentTime: 12.5 } as AudioContext
    expect(audioClock(ctx).now()).toBe(12.5)
  })
  test('performanceClock retorna segundos', () => {
    vi.spyOn(performance, 'now').mockReturnValue(2500)
    expect(performanceClock.now()).toBe(2.5)
  })
  ```
- [ ] **Step 4:** `npm test` → FAIL (módulo inexistente).
- [ ] **Step 5:** Implementar `clock.ts` e `types.ts` conforme Interfaces. `setup.ts` pode ficar vazio (só um comentário).
- [ ] **Step 6:** `npm test && npm run lint && npm run build` → tudo passa.
- [ ] **Step 7:** Commit `chore: base de testes (vitest) e tipos do motor de voz`.

---

### Task 2: Sílabas (substitui o noteMatcher)

**Files:**
- Create: `src/recognition/syllables.ts`, `src/recognition/syllables.test.ts`

**Interfaces:**
- Consumes: `Step` de `src/data/notes.ts`.
- Produces:
  ```ts
  export function normalizeWord(w: string): string        // minúsculas, sem acento, sem pontuação
  export function wordToStep(w: string): Step | null      // só palavra inteira
  export function textToSteps(text: string): Step[]       // uma Step por palavra reconhecida, em ordem; ignora as demais
  export const VOSK_GRAMMAR: string[]  // ["do","dó","re","ré","mi","fa","fá","sol","la","lá","si","[unk]"]
  ```

- [ ] **Step 1: Teste que falha:**
  ```ts
  test.each([
    ['dó','C'],['do','C'],['Dó!','C'],['ré','D'],['re','D'],['rei','D'],['mi','E'],['me','E'],
    ['fá','F'],['fa','F'],['sol','G'],['só','G'],['lá','A'],['la','A'],['si','B'],['ti','B'],
  ])('%s → %s', (w, s) => expect(wordToStep(w)).toBe(s))
  test.each(['o','e','sola','dore','solzinho','',' '])('%s não vira nota', (w) =>
    expect(wordToStep(w)).toBeNull())
  test('textToSteps preserva ordem e repetições', () =>
    expect(textToSteps('Dó dó, ré e mi')).toEqual(['C','C','D','E']))
  ```
- [ ] **Step 2:** `npx vitest run src/recognition/syllables.test.ts` → FAIL.
- [ ] **Step 3:** Implementar com um `Record<string, Step>` de sinônimos já normalizados (`do, re, rei, mi, me, fa, sol, so, la, si, ti`). Sem casamento por prefixo.
- [ ] **Step 4:** Teste passa.
- [ ] **Step 5:** Commit `feat(voz): reconhecimento de sílabas por palavra inteira`.

---

### Task 3: Linha do tempo e pontuação (funções puras)

**Files:**
- Create: `src/engine/timeline.ts`, `src/engine/timeline.test.ts`, `src/engine/scorer.ts`, `src/engine/scorer.test.ts`

**Interfaces:**
- Consumes: `Note`, `durationBeats` de `src/data/notes.ts`; `SyllableEvent` (Task 1).
- Produces:
  ```ts
  // timeline.ts
  export interface Segment { fromIndex: number; t0: number; endedAt?: number } // t0 = início da nota fromIndex
  export interface NoteWindow { index: number; start: number; end: number }
  export function beatSeconds(bpm: number): number                    // 60 / bpm
  export function anticipation(bpm: number): number                   // min(0.15, 0.25 * beatSeconds)
  export function buildWindows(notes: Note[], bpm: number, segments: Segment[]): (NoteWindow | null)[]
  export function playheadAt(windows: (NoteWindow | null)[], t: number): number | null  // índice com start <= t < end
  export function endTime(windows: (NoteWindow | null)[]): number      // end da última janela

  // scorer.ts
  export type NoteOutcome = 'correct' | 'wrong' | 'missed'
  export function attribute(windows: (NoteWindow | null)[], bpm: number, onset: number): number | null
  export function score(notes: Note[], windows: (NoteWindow | null)[], bpm: number, events: SyllableEvent[]): NoteOutcome[]
  ```
- Regras de `buildWindows`: cada segmento dispõe as notas a partir de `fromIndex` em sequência a partir de `t0`, até o `fromIndex` do segmento seguinte. Se o segmento tem `endedAt`, a nota cuja janela contém `endedAt` e as seguintes desse segmento não recebem janela dele (a nota interrompida recomeça no próximo segmento). Índice sem janela → `null`.
- Regras de `attribute`: índice `i` cuja janela satisfaz `start − L <= onset < end − L`; senão `null`.
- Regras de `score`: eventos ordenados por `onset`; para cada nota, o primeiro evento atribuído decide (`step === note.step` → `correct`, senão `wrong`); sem evento → `missed`.

- [ ] **Step 1: Testes que falham** (`timeline.test.ts`), com `q = semínima`, `h = mínima`:
  ```ts
  test('janelas sequenciais a 60 BPM', () => {
    expect(buildWindows([q,q,h], 60, [{ fromIndex: 0, t0: 10 }])).toEqual([
      { index: 0, start: 10, end: 11 }, { index: 1, start: 11, end: 12 }, { index: 2, start: 12, end: 14 }])
  })
  test('120 BPM divide as durações', () =>
    expect(buildWindows([q,q], 120, [{ fromIndex: 0, t0: 0 }])[1]).toEqual({ index: 1, start: 0.5, end: 1 }))
  test('pausa no meio da nota 1 faz ela recomeçar no novo segmento', () => {
    const w = buildWindows([q,q,q], 60, [{ fromIndex: 0, t0: 0, endedAt: 1.4 }, { fromIndex: 1, t0: 20 }])
    expect(w).toEqual([{ index: 0, start: 0, end: 1 }, { index: 1, start: 20, end: 21 }, { index: 2, start: 21, end: 22 }])
  })
  test('anticipation', () => { expect(anticipation(60)).toBe(0.15); expect(anticipation(120)).toBe(0.125) })
  test('playheadAt', () => { const w = buildWindows([q,q], 60, [{ fromIndex: 0, t0: 0 }])
    expect(playheadAt(w, 0.5)).toBe(0); expect(playheadAt(w, 1)).toBe(1); expect(playheadAt(w, 2)).toBeNull() })
  ```
  (`scorer.test.ts`), notas `[C, D, E]` semínimas a 60 BPM, `t0 = 0`, evento `ev(step, onset, arrivedAt = onset + 0.3)`:
  ```ts
  test('sílaba no meio da janela', () => expect(score(n, w, 60, [ev('C', 0.5)])).toEqual(['correct','missed','missed']))
  test('antecipação de 100 ms conta para a nota que começa', () => expect(attribute(w, 60, 0.9)).toBe(1))
  test('chegada 1,5 s atrasada usa o onset', () =>
    expect(score(n, w, 60, [ev('D', 1.2, 2.7)])).toEqual(['missed','correct','missed']))
  test('primeira sílaba decide', () =>
    expect(score(n, w, 60, [ev('D', 0.2), ev('C', 0.4), ev('E', 0.6)])[0]).toBe('wrong'))
  test('fora de janela é descartado', () => {
    expect(attribute(w, 60, -0.5)).toBeNull(); expect(attribute(w, 60, 3.5)).toBeNull() })
  test('evento durante a pausa é descartado', () => {
    const wp = buildWindows(n, 60, [{ fromIndex: 0, t0: 0, endedAt: 1.4 }, { fromIndex: 1, t0: 20 }])
    expect(score(n, wp, 60, [ev('D', 5)])).toEqual(['missed','missed','missed']) })
  test('eventos fora de ordem são ordenados por onset', () =>
    expect(score(n, w, 60, [ev('C', 0.6), ev('D', 0.3)])[0]).toBe('wrong'))
  ```
- [ ] **Step 2:** `npx vitest run src/engine` → FAIL.
- [ ] **Step 3:** Implementar `timeline.ts` e `scorer.ts`.
- [ ] **Step 4:** Testes passam.
- [ ] **Step 5:** Commit `feat(motor): linha do tempo e pontuação por onset`.

---

### Task 4: Detector de início de fala e alinhador

**Files:**
- Create: `src/recognition/onsetDetector.ts`, `src/recognition/onsetDetector.test.ts`, `src/recognition/aligner.ts`, `src/recognition/aligner.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // onsetDetector.ts
  export interface OnsetDetectorOptions {
    hopSeconds?: number        // 0.01
    minBurstSeconds?: number   // 0.06  (rajadas menores são ruído)
    minGapSeconds?: number     // 0.06  (silêncio mínimo para separar falas)
    thresholdRatio?: number    // 4     (energia > ruído de fundo × ratio)
  }
  export interface OnsetDetector {
    push(samples: Float32Array, startTime: number, sampleRate: number): number[] // onsets confirmados neste bloco
    reset(): void
  }
  export function createOnsetDetector(opts?: OnsetDetectorOptions): OnsetDetector

  // aligner.ts
  export interface Aligner {
    pushOnset(t: number): void
    pushStep(step: Step, arrivedAt: number): SyllableEvent | null   // null se não há onset pendente
    reset(): void
  }
  export function createAligner(opts?: { maxPendingSeconds?: number /* 3 */ }): Aligner
  ```
- Algoritmo do detector: RMS por janela de `hopSeconds`; ruído de fundo = média móvel exponencial (α = 0.05) das janelas abaixo do limiar; uma fala começa quando RMS > `max(ruído × thresholdRatio, 0.01)`. O onset (horário da primeira janela acima do limiar) só é **confirmado** depois de `minBurstSeconds` contínuos acima; rajadas mais curtas são descartadas. Nova fala só depois de `minGapSeconds` abaixo do limiar. O estado persiste entre blocos.
- Alinhador: onsets pendentes em fila; `pushStep` consome o mais antigo com `onset >= arrivedAt − maxPendingSeconds` (descarta os mais velhos) e retorna `{ step, onset, arrivedAt }`; sem onset → `null`.

- [ ] **Step 1: Testes que falham.** Helper `signal(sr, parts: [seconds, amplitude][])` gera senoide de 220 Hz por trecho (amplitude 0 = silêncio).
  ```ts
  test('silêncio → fala → silêncio gera um onset no início da fala', () => {
    const d = createOnsetDetector()
    const out = d.push(signal(16000, [[0.5, 0], [0.3, 0.3], [0.5, 0]]), 100, 16000)
    expect(out).toHaveLength(1); expect(out[0]).toBeCloseTo(100.5, 1) // tolerância 20 ms: usar Math.abs(out[0]-100.5) < 0.02
  })
  test('rajada de 30 ms não gera onset', () =>
    expect(createOnsetDetector().push(signal(16000, [[0.5,0],[0.03,0.5],[0.5,0]]), 0, 16000)).toEqual([]))
  test('duas falas separadas por 80 ms geram dois onsets', () =>
    expect(createOnsetDetector().push(signal(16000, [[0.5,0],[0.2,0.3],[0.08,0],[0.2,0.3],[0.3,0]]), 0, 16000)).toHaveLength(2))
  test('onset atravessa a fronteira entre blocos', () => {
    const d = createOnsetDetector(); const s = signal(16000, [[0.5,0],[0.3,0.3],[0.2,0]])
    const a = d.push(s.subarray(0, 8320), 0, 16000); const b = d.push(s.subarray(8320), 0.52, 16000)
    expect([...a, ...b]).toHaveLength(1) })
  ```
  Alinhador:
  ```ts
  test('casa pela ordem', () => { const a = createAligner(); a.pushOnset(1); a.pushOnset(2)
    expect(a.pushStep('C', 2.5)).toEqual({ step: 'C', onset: 1, arrivedAt: 2.5 })
    expect(a.pushStep('D', 2.6)?.onset).toBe(2) })
  test('sem onset retorna null', () => expect(createAligner().pushStep('C', 1)).toBeNull())
  test('descarta onset mais velho que 3 s', () => { const a = createAligner(); a.pushOnset(1); a.pushOnset(4.5)
    expect(a.pushStep('C', 5)?.onset).toBe(4.5) })
  ```
- [ ] **Step 2:** `npx vitest run src/recognition` → FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Testes passam.
- [ ] **Step 5:** Commit `feat(voz): detector de início de fala e alinhador`.

---

### Task 5: Microfone e armazenamento do modelo

**Files:**
- Create: `src/audio/micInput.ts`, `src/audio/chunker.ts`, `src/audio/chunker.test.ts`, `public/worklets/mic-tap.js`, `src/recognition/modelStore.ts`, `src/recognition/modelStore.test.ts`, `scripts/fetch-model.mjs`, `vercel.json`
- Modify: `package.json` (scripts), `.gitignore`

**Interfaces:**
- Produces:
  ```ts
  // chunker.ts — agrupa quanta de 128 amostras do worklet em blocos maiores
  export function createChunker(size: number, onChunk: (samples: Float32Array, startTime: number) => void):
    { push(samples: Float32Array, time: number, sampleRate: number): void }
  // micInput.ts
  export interface MicInput {
    readonly context: AudioContext
    readonly sampleRate: number
    onFrame(cb: (samples: Float32Array, startTime: number) => void): () => void  // blocos de 2048 amostras
    close(): void
  }
  export function createAudioContext(): AudioContext          // chamar DENTRO do gesto do usuário; chama resume()
  export async function openMic(ctx: AudioContext): Promise<MicInput>  // rejeita Error('denied') | Error('unsupported')
  export function isVoiceSupported(): boolean                 // getUserMedia && AudioContext && audioWorklet
  // modelStore.ts
  export const MODEL_PATH = '/models/vosk-pt-small.tar.gz'
  export async function isModelCached(): Promise<boolean>
  export async function downloadModel(onProgress: (fraction: number) => void): Promise<void>
  export async function getModelUrl(): Promise<string>        // blob: URL do cache; lança se não estiver em cache
  ```
- `mic-tap.js`: `AudioWorkletProcessor` registrado como `'mic-tap'` que faz `this.port.postMessage({ samples: inputs[0][0].slice(), time: currentTime })` a cada quantum (se houver entrada) e retorna `true`.
- `openMic`: `getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } })`, `ctx.audioWorklet.addModule('/worklets/mic-tap.js')`, `MediaStreamSource → AudioWorkletNode('mic-tap')`; o nó **não** é ligado ao `destination`. Usa `createChunker(2048, …)`.
- `modelStore`: Cache API, nome de cache `'leitura-musical-models-v1'`. `downloadModel` lê `content-length` e o stream do `fetch(MODEL_PATH)` para reportar progresso, depois `cache.put`.
- `scripts/fetch-model.mjs`: se `public/models/vosk-pt-small.tar.gz` não existe, baixa `https://alphacephei.com/vosk/models/vosk-model-small-pt-0.3.zip`, descompacta com `fflate` (`unzipSync`) para um diretório temporário e empacota com `tar` (`tar.c({ gzip: true, cwd: tmp, file: out }, ['vosk-model-small-pt-0.3'])`). Logs em pt-BR.
- `package.json`: `"predev": "node scripts/fetch-model.mjs"`, `"prebuild": "node scripts/fetch-model.mjs"`. `.gitignore`: `public/models/`.
- `vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` (arquivos estáticos têm prioridade na Vercel).

- [ ] **Step 1: Testes que falham:**
  ```ts
  test('chunker agrupa 16 quanta em um bloco com o horário do primeiro', () => {
    const got: [number, number][] = []; const c = createChunker(2048, (s, t) => got.push([s.length, t]))
    for (let i = 0; i < 17; i++) c.push(new Float32Array(128), 5 + i * 128 / 16000, 16000)
    expect(got).toEqual([[2048, 5]]) })
  test('isModelCached consulta o cache', async () => {
    globalThis.caches = { open: async () => ({ match: async () => new Response('x') }) } as unknown as CacheStorage
    expect(await isModelCached()).toBe(true) })
  test('downloadModel reporta progresso até 1 e grava no cache', async () => { /* fetch falso com content-length 4 e 2 chunks; espera progress [0.5, 1] e cache.put chamado com MODEL_PATH */ })
  test('getModelUrl lança se não estiver em cache', async () => { /* match → undefined */ await expect(getModelUrl()).rejects.toThrow() })
  ```
- [ ] **Step 2:** `npx vitest run src/audio src/recognition/modelStore.test.ts` → FAIL.
- [ ] **Step 3:** Implementar todos os arquivos da tarefa.
- [ ] **Step 4:** Testes passam; `node scripts/fetch-model.mjs` gera o arquivo (≈ 30 MB) e uma segunda execução diz que já existe; `npm run build` passa e `dist/models/vosk-pt-small.tar.gz` existe.
- [ ] **Step 5:** Commit `feat(audio): microfone com worklet, cache do modelo e script de download`.

---

### Task 6: Reconhecedor Web Speech (plano B)

**Files:**
- Create: `src/recognition/webSpeechRecognizer.ts`, `src/recognition/webSpeechRecognizer.test.ts`

**Interfaces:**
- Consumes: `MicInput` (Task 5), `createOnsetDetector`, `createAligner` (Task 4), `textToSteps` (Task 2), `NoteRecognizer` (Task 1).
- Produces:
  ```ts
  export function hasWebSpeech(): boolean
  export function createWebSpeechRecognizer(mic: MicInput, deps?: { Ctor?: SpeechRecognitionCtor }): NoteRecognizer // kind 'online'
  ```
- Comportamento: `lang = 'pt-BR'`, `continuous = true`, `interimResults = true`. Frames do mic → `onsetDetector` → `aligner.pushOnset`. Em `onresult`, para cada `i` de `e.resultIndex` até `e.results.length − 1`: `steps = textToSteps(results[i][0].transcript)`; `emitted[i]` guarda quantos já saíram; emite só `steps.slice(emitted[i])` via `aligner.pushStep(step, ctx.currentTime)` e atualiza `emitted[i] = max(emitted[i], steps.length)`. Erros `not-allowed`/`service-not-allowed` → status `error` com `'denied'`. `onend` com reconhecedor ativo → `start()` de novo e zera `emitted`. Os tipos mínimos da Web Speech API que hoje estão em `useSpeechNotes.ts` migram para cá.

- [ ] **Step 1: Testes que falham** com `FakeRecognition` (classe que guarda os handlers e expõe `emit(results, resultIndex)`) e um `MicInput` falso cujo `onFrame` é controlado pelo teste. Antes de cada `emit`, empurrar onsets no detector falso — mais simples: injetar `deps.aligner` não; em vez disso, o teste alimenta o mic falso com `signal()` de duas falas antes de emitir.
  ```ts
  test('parciais acumulados não reemitem sílabas (regressão do encavalar)', () => {
    // emit([{0:'dó', isFinal:false}]), emit([{0:'dó ré', isFinal:false}]), emit([{0:'dó ré', isFinal:true}])
    expect(steps).toEqual(['C', 'D']) })
  test('nota repetida no mesmo resultado gera duas sílabas', () => /* 'dó dó' → ['C','C'] */)
  test('parcial revisado para menos palavras não emite nada novo', () => /* 'sol lá' → final 'sola' → ['G','A'] apenas */)
  test('onend reinicia o reconhecimento', () => /* fake.onend(); expect(fake.start).toHaveBeenCalledTimes(2) */)
  test('not-allowed vira status error/denied', () => /* onerror({error:'not-allowed'}) */)
  ```
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Testes passam.
- [ ] **Step 5:** Commit `feat(voz): reconhecedor Web Speech com consumo incremental`.

---

### Task 7: Reconhecedor Vosk (motor local)

**Files:**
- Create: `src/recognition/voskRecognizer.ts`, `src/recognition/voskRecognizer.test.ts`

**Interfaces:**
- Consumes: `MicInput`, `getModelUrl` (Task 5), `createOnsetDetector`, `createAligner` (Task 4), `textToSteps`, `VOSK_GRAMMAR` (Task 2).
- Produces:
  ```ts
  export interface VoskModelLike { KaldiRecognizer: new (sampleRate: number, grammar?: string) => VoskRecognizerLike; terminate(): void }
  export interface VoskRecognizerLike {
    on(event: 'result' | 'partialresult' | 'error', cb: (m: any) => void): void
    setWords(v: boolean): void
    acceptWaveformFloat(buf: Float32Array, sampleRate: number): void
    remove(): void
  }
  export interface FinalWord { word: string; start: number; end: number; conf: number } // para o diagnóstico
  export function createVoskRecognizer(mic: MicInput, deps?: {
    loadModel?: () => Promise<VoskModelLike>       // padrão: import('vosk-browser') + createModel(await getModelUrl())
    onFinalWords?: (words: FinalWord[], streamStart: number) => void
  }): NoteRecognizer // kind 'local'
  ```
- Comportamento: `start()` carrega o modelo (status `loading` → `ready`), cria `KaldiRecognizer(mic.sampleRate, JSON.stringify(VOSK_GRAMMAR))`, `setWords(true)`, guarda `streamStart` = `startTime` do primeiro frame e passa cada frame para `acceptWaveformFloat` e para o `onsetDetector`. Em `partialresult`: `steps = textToSteps(partial)`, emite os que passam de `emittedInUtterance`. Em `result`: emite o que faltar do texto final, chama `onFinalWords(result.result, streamStart)` e zera `emittedInUtterance`. Falha de carga → `start()` rejeita `Error('load-failed')`; evento `error` do recognizer após `ready` → status `error`/`'crashed'`.
- Escala de amostras: se no diagnóstico o Vosk não reconhecer nada com floats em [-1, 1], multiplicar por 32768 antes de `acceptWaveformFloat` (o Kaldi espera escala int16). Deixar a escala numa constante `SAMPLE_SCALE` exportada.

- [ ] **Step 1: Testes que falham** com `FakeModel`/`FakeKaldi` que guardam handlers:
  ```ts
  test('parciais crescentes emitem só as sílabas novas', async () => /* partial 'dó' → 'dó ré' → result 'dó ré' : ['C','D'] */)
  test('após result, a próxima fala recomeça a contagem', async () => /* result 'dó', partial 'dó' : ['C','C'] */)
  test('gramática restrita é passada ao recognizer', async () => expect(kaldiArgs[1]).toBe(JSON.stringify(VOSK_GRAMMAR)))
  test('falha ao carregar rejeita load-failed', async () => await expect(r.start()).rejects.toThrow('load-failed'))
  test('onFinalWords recebe as palavras com streamStart', async () => /* ... */)
  ```
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Testes passam.
- [ ] **Step 5:** Commit `feat(voz): reconhecedor local Vosk com gramática restrita`.

---

### Task 8: Player guiado pelo relógio

**Files:**
- Create: `src/engine/useTimelinePlayer.ts`, `src/engine/useTimelinePlayer.test.ts`

**Interfaces:**
- Consumes: `Clock` (Task 1), `buildWindows`, `playheadAt`, `endTime`, `beatSeconds`, `Segment`, `NoteWindow` (Task 3).
- Produces:
  ```ts
  export type PlayerPhase = 'idle' | 'countIn' | 'playing' | 'paused' | 'finished'
  export interface TimelinePlayer {
    phase: PlayerPhase
    index: number                 // nota em exibição (0 no countIn)
    countIn: number               // 4..1 durante countIn, 0 fora
    beat: number                  // contador de tempos desde o início do segmento (para o pulso visual)
    windows: (NoteWindow | null)[]
    start(clock: Clock): void     // countIn de 4 tempos a partir de clock.now()
    pause(): void
    resume(): void                // novo countIn e novo segmento a partir de index
    stop(): void                  // volta a idle
  }
  export function useTimelinePlayer(opts: { notes: Note[]; bpm: number; onFinish: (endedAt: number) => void }): TimelinePlayer
  ```
- Loop por `requestAnimationFrame` lendo `clock.now()`; o BPM é congelado no `start`/`resume`. `onFinish` dispara uma vez quando `now >= endTime(windows)`.

- [ ] **Step 1: Testes que falham** com `renderHook` e `vi.useFakeTimers({ toFake: ['requestAnimationFrame','cancelAnimationFrame','performance'] })`, usando `performanceClock`:
  ```ts
  test('countIn 4..1 e depois toca a nota 0', () => { start; expect(countIn).toBe(4); advance(1000) → 3; advance(3000) → phase 'playing', index 0 })
  test('avança no ritmo (60 BPM)', () => { /* após countIn, advance(1000) → index 1 */ })
  test('chama onFinish uma vez no fim', () => { /* 2 semínimas: advance(4000+2000+100) → onFinish 1x */ })
  test('pause congela e resume refaz o countIn da mesma nota', () => { /* pause em index 1; advance(5000) → index 1; resume → countIn 4; após 4 s → index 1 */ })
  test('mudar bpm durante a execução não altera as janelas', () => { /* rerender com bpm 120; windows iguais */ })
  ```
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Testes passam.
- [ ] **Step 5:** Commit `feat(motor): player guiado pelo relógio de áudio`.

---

### Task 9: Escolha do motor

**Files:**
- Create: `src/recognition/selectRecognizer.ts`, `src/recognition/selectRecognizer.test.ts`

**Interfaces:**
- Consumes: Tasks 5, 6, 7.
- Produces:
  ```ts
  export interface SelectDeps {
    createLocal: (mic: MicInput) => NoteRecognizer
    createOnline: (mic: MicInput) => NoteRecognizer | null   // null quando não há Web Speech
    isModelCached: () => Promise<boolean>
    deviceMemory?: number
  }
  export async function selectRecognizer(mic: MicInput, timeoutSeconds: number, deps?: Partial<SelectDeps>): Promise<NoteRecognizer | null>
  ```
- Regra: se modelo em cache e `(deviceMemory ?? 4) >= 2` → tenta `createLocal(mic).start()` com timeout; sucesso → local. Falha, timeout ou sem cache → `createOnline`; se `start()` resolver → online. Senão → `null`. No timeout, o local é parado (`stop()`).

- [ ] **Step 1: Testes que falham:**
  ```ts
  test('modelo em cache e carga ok → local')
  test('sem cache → online, sem tentar o local')
  test('deviceMemory 1 → online')
  test('local rejeita → online')
  test('local não fica pronto no timeout → online e local.stop() chamado') // fake timers
  test('online indisponível (null) e local falhou → null')
  ```
- [ ] **Step 2:** FAIL. **Step 3:** Implementar. **Step 4:** Passa.
- [ ] **Step 5:** Commit `feat(voz): escolha automática do motor com plano B`.

---

### Task 10: Página de diagnóstico (spike)

**Files:**
- Create: `src/routes/Diagnostico.tsx`, `src/recognition/diagnostics.ts`, `src/recognition/diagnostics.test.ts`
- Modify: `src/App.tsx` (rota `/diagnostico`, sem link no menu)

**Interfaces:**
- Consumes: `createAudioContext`, `openMic`, `downloadModel`, `isModelCached` (Task 5), `createVoskRecognizer` (Task 7), `createWebSpeechRecognizer` (Task 6).
- Produces:
  ```ts
  // diagnostics.ts (puro)
  export interface LatencyStats { count: number; mean: number; p90: number }
  export function latencyStats(events: SyllableEvent[]): LatencyStats      // arrivedAt − onset
  export function accuracy(expected: Step[], got: (Step | null)[]): number  // fração de acertos posição a posição
  ```
- Página: escolha de motor (local/online), botão "Baixar modelo" com progresso, tempo de carga do modelo, `performance.memory.usedJSHeapSize` quando existir, e um teste guiado: sequência fixa `C D E F G A B` mostrada no andamento escolhido (60 ou 90 BPM) usando `useTimelinePlayer` + `score`. Ao fim, mostra latência média e p90, acerto, e para o Vosk a diferença média entre `onset` do detector e `streamStart + word.start`. Mostra "APROVADO" se p90 < 0,5 s e acerto ≥ 0,9. Layout simples; o redesign vem depois.

- [ ] **Step 1: Testes que falham** de `latencyStats` (`[0.1,0.2,…,1.0]` → mean 0.55, p90 0.9) e `accuracy` (`['C','D','E']` vs `['C',null,'F']` → 1/3).
- [ ] **Step 2:** FAIL. **Step 3:** Implementar `diagnostics.ts` e a página. **Step 4:** Testes passam; `npm run build` passa.
- [ ] **Step 5:** Verificação no navegador: `preview_start` com `leitura-musical`, abrir `/diagnostico`, baixar o modelo, selecionar motor local e confirmar status "pronto" (o microfone pode não estar disponível no painel; nesse caso registre isso, sem bloquear).
- [ ] **Step 6:** Commit `feat(voz): página de diagnóstico do motor`.

---

### Task 11: Sessão de prática

**Files:**
- Create: `src/engine/usePracticeSession.ts`, `src/engine/usePracticeSession.test.ts`, `src/recognition/fakeRecognizer.ts`

**Interfaces:**
- Consumes: `useTimelinePlayer` (Task 8), `attribute`, `score` (Task 3), `selectRecognizer` (Task 9), `createAudioContext`, `openMic` (Task 5), `audioClock`, `performanceClock` (Task 1).
- Produces:
  ```ts
  export type FeedbackState = 'idle' | 'correct' | 'wrong'
  export type EngineLabel = 'local' | 'online' | 'silent'
  export interface SessionDeps {
    createContext: () => AudioContext | null
    openMic: (ctx: AudioContext) => Promise<MicInput>
    select: (mic: MicInput, timeoutSeconds: number) => Promise<NoteRecognizer | null>
    clockFor: (ctx: AudioContext | null) => Clock
  }
  export interface PracticeSession {
    phase: PlayerPhase; index: number; countIn: number; beat: number
    feedback: FeedbackState; lastHeard: string | null
    engine: EngineLabel | null; voiceError: RecognizerError | null; listening: boolean
    start(): void; pause(): void; resume(): void; restart(): void
  }
  export function usePracticeSession(opts: {
    piece: Piece; voiceEnabled: boolean; bpm: number
    onComplete: (r: { results: NoteResult[]; durationMs: number }) => void
    deps?: Partial<SessionDeps>
  }): PracticeSession
  // fakeRecognizer.ts (para testes)
  export function createFakeRecognizer(kind?: RecognizerKind): NoteRecognizer & { emit(e: SyllableEvent): void }
  ```
- `start()` é síncrono no que importa ao iOS: chama `createContext()` imediatamente (no gesto), inicia o player com `clockFor(ctx)` e em paralelo abre o mic e seleciona o motor com timeout = duração da contagem de entrada − 0,5 s. Erro `'denied'` do mic → `voiceError = 'denied'`, `engine = 'silent'`.
- Cada `SyllableEvent`: descarta se `phase` não é `playing`/`countIn` ou se `onset` < início da execução atual; guarda em lista; se `attribute(...) === index` exibido e é o primeiro evento daquela nota, define `feedback` e `lastHeard` (`SOLFEGE[step]`). `feedback` volta a `idle` ao mudar de nota.
- Fim: no `onFinish` do player, espera 1,5 s (no relógio), para o reconhecedor, calcula `score` e chama `onComplete` com `NoteResult { note, outcome }` (`outcome: null` no modo silencioso).
- `restart()` para o reconhecedor atual, limpa eventos e começa de novo; `document.visibilitychange` para `hidden` chama `pause()`.
- `NoteResult` muda em `src/store/usePracticeStore.ts`: `{ note: Note; outcome: NoteOutcome | null }`. Esta tarefa altera **só o tipo**; `Results.tsx` é ajustado na Task 12. Para o build passar, troque em `Results.tsx` e `Practice.tsx` os usos de `.correct` pelo equivalente com `outcome` de forma mínima.

- [ ] **Step 1: Testes de integração que falham** (fake timers + `performanceClock` + `createFakeRecognizer`), peça `[C, D, E]` a 60 BPM:
  ```ts
  test('lição completa com acertos, erro e sem resposta', async () => {
    // start; após countIn: emit C (onset na nota 0), emit F (nota 1), nada na nota 2
    // avançar até o fim + 1,5 s → onComplete com outcomes ['correct','wrong','missed']
  })
  test('evento atrasado é pontuado na nota certa sem feedback visual', ...)
  test('reiniciar descarta eventos da execução anterior', ...) // emit com onset anterior ao restart → ignorado
  test('mic negado → modo silencioso com outcome null', ...)
  test('aba oculta pausa a sessão', ...)
  test('feedback mostra verde na nota atual e volta a idle na próxima', ...)
  ```
- [ ] **Step 2:** FAIL. **Step 3:** Implementar. **Step 4:** Passa (todos os testes do projeto).
- [ ] **Step 5:** Commit `feat(motor): sessão de prática com atribuição por onset`.

---

### Task 12: Integração na interface e remoção do motor antigo

**Files:**
- Modify: `src/routes/Practice.tsx`, `src/routes/Results.tsx`, `src/routes/Settings.tsx`, `src/components/VoiceFeedback.tsx`, `src/components/SpeedControl.tsx`
- Create: `src/components/BeatPulse.tsx`, `src/components/ModelDownload.tsx`, `src/routes/Results.test.tsx`
- Delete: `src/engine/useSpeechNotes.ts`, `src/engine/noteMatcher.ts`, `src/engine/usePlayer.ts`

**Interfaces:**
- Consumes: `usePracticeSession` (Task 11), `isVoiceSupported` (Task 5), `downloadModel`, `isModelCached` (Task 5), `hasWebSpeech` (Task 6).
- Produces:
  - `SpeedControl` ganha prop `disabled?: boolean`.
  - `BeatPulse({ beat: number; active: boolean })`: um círculo que pisca a cada mudança de `beat`.
  - `VoiceFeedback` recebe `engine: EngineLabel | null` e `error: RecognizerError | null`, mostra "voz: local" / "voz: online" e as mensagens de erro (denied, unsupported, load-failed).
  - `ModelDownload`: em Configurações, quando a voz está ligada e o modelo não está em cache, mostra "Baixar motor de voz (≈ 30 MB)" com barra de progresso; ao terminar, "Motor de voz pronto para uso offline".

- [ ] **Step 1: Teste que falha** `Results.test.tsx`: com uma sessão no store `[correct, wrong, missed]`, a tela mostra "1 de 3 notas certas" e a legenda contém "sem resposta".
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** `Practice.tsx` passa a usar só `usePracticeSession` (contagem mostra `countIn`; `SpeedControl disabled` quando `phase` é `playing`/`countIn`; `BeatPulse` visível). `Results.tsx` usa `outcome` com três cores (`--success`, `--error`, `--border` para sem resposta) e legenda "🟩 acertou · 🟥 errou · ⬜ sem resposta". `Settings.tsx` usa `isVoiceSupported()` no lugar de `speechSupported` e mostra `ModelDownload`. Remover os três arquivos antigos.
- [ ] **Step 4:** `npm test && npm run lint && npm run build` passam; `grep -r "useSpeechNotes\|noteMatcher\|engine/usePlayer" src` vazio.
- [ ] **Step 5:** Verificação no navegador (`preview_start leitura-musical`): Home → lição → Iniciar mostra contagem 4-3-2-1 e o pulso; com voz desligada a lição vai até o fim e mostra o resultado; Configurações mostra o download do modelo. Sem erros no console.
- [ ] **Step 6:** Commit `feat: nova sessão de prática na interface e remoção do motor antigo`.

---

### Task 13: Verificação final do motor

- [ ] **Step 1:** `npm test`, `npm run lint`, `npm run build` — registrar saída.
- [ ] **Step 2:** No painel do navegador: fluxo completo sem voz; `/diagnostico` carregando o modelo local; recarregar `/diagnostico` direto (rota profunda) funciona no `vite preview`.
- [ ] **Step 3:** Atualizar `README.md` (seção Funcionalidades e Estrutura: motor local, plano B, `/diagnostico`, `npm test`, script do modelo).
- [ ] **Step 4:** Commit `docs: README do novo motor de voz`.
