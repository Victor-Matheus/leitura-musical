# Módulo de teoria (MSA) e hinos — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trilha de 12 lições originais de teoria (na progressão do MSA) com exercícios corrigidos na hora, leitura métrica com o motor existente, progresso local e uma seção de hinos (domínio público + editor).

**Architecture:** O conteúdo fica em dados TypeScript tipados. Os geradores de pergunta são funções puras com rng semeado, e `music.ts` é a fonte de verdade da teoria. Uma `ScoreView` VexFlow genérica desenha clave, armadura, fórmula de compasso, notas, pausas e ponto. As stores zustand com persist guardam o progresso e os hinos. As telas usam os componentes `ui/` existentes.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind 4, VexFlow 5, Zustand 5, Vitest + Testing Library, lucide-react.

**Spec:** `docs/superpowers/specs/2026-10-11-teoria-msa-design.md`

## Global Constraints

- **Direitos autorais:** nenhum texto do MSA nem do Hinário. Lições com redação original; hinos embutidos só em domínio público (ano < 1900) e sem letra.
- Texto de interface e conteúdo em pt-BR, frases curtas, para iniciantes.
- Nomes de nota em solfejo (Dó, Ré, Mi, Fá, Sol, Lá, Si), acidentes como "♯" e "♭" no texto exibido.
- Nenhuma cor fixa em componentes: só `var(--token)`. Pauta VexFlow com cores via `readToken`, redesenhada quando o alto contraste muda, como `NoteStaff` já faz.
- Componentes de UI existentes: `Button`, `Card`, `Badge`, `IconBox` (`src/components/ui`). Ícones lucide com `strokeWidth={1.75}`.
- Layout sem rolagem horizontal em 375 px.
- Chaves de localStorage: `leitura-musical-progress` e `leitura-musical-hymns`.
- tsconfig: `verbatimModuleSyntax`, `erasableSyntaxOnly` e `noUnused*`. Nada de `enum`; usar `import type`.
- Commits sem `Co-Authored-By`. `git add` só dos arquivos da tarefa, porque há tarefas paralelas. Se aparecer `index.lock`, esperar 2 s e tentar de novo.
- `npm test`, `npm run lint` e `npm run build` passando ao fim de cada tarefa. Se a falha vier de arquivo de outra tarefa em andamento, relatar.

## Review Focus

1. **Correção musical:** uma resposta errada ensinada como certa é o pior defeito possível. Exemplos: intervalo mal classificado, armadura trocada, valor de figura errado. Os testes de `music.ts` (Task 1) e dos geradores (Tasks 3 e 4) conferem cada resposta contra `music.ts`, e há uma revisão musical dedicada no final.
2. **Clave de fá:** a posição das notas na clave de fá é diferente da clave de sol. Teste em Task 2: Sol2 a Dó4 na clave de fá geram as chaves VexFlow corretas, com o `clef` repassado à StaveNote.
3. **Celular estreito:** pautas com muitas notas não podem estourar a largura. Verificação visual na Task 10.
4. **Opções ambíguas:** duas opções equivalentes, como Dó♯ e Ré♭ numa pergunta de nome de nota, não podem aparecer juntas. Teste em Task 3.
5. **Hino do editor:** precisa ser praticável. A semínima pontuada é tocada com 1,5 tempo. Teste em Task 1 (`noteBeats`) e em Task 9 (o editor salva `dots`).

## Ondas

| Onda | Tarefas (paralelas dentro da onda) |
|---|---|
| 1 | Task 1 |
| 2 | Task 2, Task 3, Task 4, Task 5 |
| 3 | Task 6, Task 7 |
| 4 | Task 8, Task 9 |
| 5 | Task 10 |

---

### Task 1: Tipos, rng, teoria pura e ponto de aumento no motor

**Files:**
- Create: `src/theory/types.ts`, `src/theory/rng.ts`, `src/theory/rng.test.ts`, `src/theory/music.ts`, `src/theory/music.test.ts`
- Modify: `src/data/notes.ts`, `src/engine/timeline.ts`, `src/engine/timeline.test.ts` (só se precisar adaptar o import)

**Interfaces — Produces:**
```ts
// notes.ts
export interface Note { step: Step; octave: number; accidental?: Accidental; duration: Duration; dots?: 0 | 1 }
export function durationBeats(duration: Duration): number   // mantém
export function noteBeats(n: { duration: Duration; dots?: 0 | 1 }): number  // × 1.5 se dots
// timeline.ts passa a usar noteBeats(notes[i])

// theory/types.ts — exatamente os tipos da Seção 4.1 do spec:
// ScoreElement, Block, ScoreBlock (= Omit<Extract<Block,{kind:'score'}>,'kind'>), ExerciseType, ExerciseSpec, Question, Lesson
export type Generator = (params: Record<string, unknown>, rng: Rng) => Question

// rng.ts
export type Rng = () => number                       // [0,1)
export function mulberry32(seed: number): Rng
export function pick<T>(rng: Rng, xs: readonly T[]): T
export function shuffle<T>(rng: Rng, xs: readonly T[]): T[]   // não muta
export function randomSeed(): number

// music.ts
export interface Pitch { step: Step; accidental?: Accidental; octave: number }
export function pitchToMidi(p: Pitch): number
export function solfege(p: Pick<Pitch,'step'|'accidental'>): string        // "Fá♯", "Si♭", "Dó"
export interface IntervalInfo { number: number; quality: 'maior' | 'menor' | 'justa' | 'aumentada' | 'diminuta' }
export function intervalBetween(low: Pitch, high: Pitch): IntervalInfo      // número pelas letras, qualidade pelos semitons
export function intervalName(i: IntervalInfo, withQuality: boolean): string // "3ª maior", "5ª justa", "2ª"
export function majorScale(tonic: { step: Step; accidental?: Accidental }): { step: Step; accidental?: Accidental }[] // 7 graus
export const MAJOR_KEYS: { name: string; tonic: { step: Step; accidental?: Accidental }; sharps: number; flats: number; vexKey: string }[]
// Dó, Sol, Ré, Lá, Mi (até 4♯) e Fá, Si♭, Mi♭, Lá♭ (até 4♭); vexKey ex. 'G','D','Bb'
export function semitones(a: Pitch, b: Pitch): number
```

- [ ] **Step 1: testes que falham** em `music.test.ts`:
  ```ts
  test.each([
    ['C4','E4','3ª maior'],['C4','Eb4','3ª menor'],['C4','G4','5ª justa'],['C4','F4','4ª justa'],
    ['C4','F#4','4ª aumentada'],['B3','F4','5ª diminuta'],['C4','D4','2ª maior'],['E4','F4','2ª menor'],
    ['C4','A4','6ª maior'],['E4','C5','6ª menor'],['C4','B4','7ª maior'],['D4','C5','7ª menor'],
    ['C4','C5','8ª justa'],['G4','B4','3ª maior'],['A4','C5','3ª menor'],['D4','F#4','3ª maior'],
    ['F4','Bb4','4ª justa'],['Bb3','F4','5ª justa'],['E4','G#4','3ª maior'],['B3','D4','3ª menor'],
  ])('%s→%s = %s', (a, b, name) => expect(intervalName(intervalBetween(p(a), p(b)), true)).toBe(name))
  test('escalas maiores', () => {
    expect(majorScale({ step: 'G' }).map(solfege)).toEqual(['Sol','Lá','Si','Dó','Ré','Mi','Fá♯'])
    expect(majorScale({ step: 'F' }).map(solfege)).toEqual(['Fá','Sol','Lá','Si♭','Dó','Ré','Mi'])
    expect(majorScale({ step: 'D' }).map(solfege)).toEqual(['Ré','Mi','Fá♯','Sol','Lá','Si','Dó♯'])
    expect(majorScale({ step: 'B', accidental: 'b' }).map(solfege)).toEqual(['Si♭','Dó','Ré','Mi♭','Fá','Sol','Lá'])
    expect(majorScale({ step: 'C' }).map(solfege)).toEqual(['Dó','Ré','Mi','Fá','Sol','Lá','Si'])
  })
  test('armaduras', () => {
    expect(MAJOR_KEYS.find(k => k.name === 'Ré maior')).toMatchObject({ sharps: 2, flats: 0, vexKey: 'D' })
    expect(MAJOR_KEYS.find(k => k.name === 'Mi♭ maior')).toMatchObject({ sharps: 0, flats: 3, vexKey: 'Eb' })
    expect(MAJOR_KEYS).toHaveLength(9)
  })
  ```
  (`p('F#4')` é um helper de teste que faz o parse de "letra + acidente + oitava".)
  Em `rng.test.ts`: `mulberry32(42)` é determinístico (a mesma sequência duas vezes); `shuffle` não muta e preserva os elementos.
  Em `src/data/notes.test.ts`: `noteBeats({duration:'h', dots:1}) === 3`, `noteBeats({duration:'q'}) === 1`, `noteBeats({duration:'8', dots:1}) === 0.75`.
- [ ] **Step 2:** `npx vitest run src/theory src/data` → FAIL.
- [ ] **Step 3:** implementar. Em `timeline.ts`, troque `durationBeats(notes[i].duration)` por `noteBeats(notes[i])`.
- [ ] **Step 4:** `npm test`, `npm run lint` e `npm run build` passam (os testes do motor continuam verdes).
- [ ] **Step 5:** commit `feat(teoria): tipos, rng semeado e utilitários de teoria; ponto de aumento no motor`.

---

### Task 2: ScoreView (pauta genérica)

**Files:** Create `src/components/ScoreView.tsx`, `src/components/scoreView.ts`, `src/components/ScoreView.test.tsx`

**Interfaces:**
- Consumes: `ScoreBlock`, `ScoreElement` (Task 1); `readToken` (`src/theme/readToken.ts`); `vexKey` (`notes.ts`).
- Produces:
  ```ts
  // scoreView.ts (puro, testável sem DOM do VexFlow)
  export function vexDuration(d: Duration, dots?: 0|1, rest?: boolean): string // 'q' 'qd' 'hr' 'hdr' ...
  export function describeScore(s: ScoreBlock): string   // aria-label: "Clave de sol, compasso 3/4: Sol semínima, Lá mínima pontuada, pausa de semínima"
  export function splitIntoLines(elements: ScoreElement[], maxPerLine: number): ScoreElement[][] // quebra em barras quando possível
  // ScoreView.tsx
  export function ScoreView(props: ScoreBlock & { highContrast?: boolean; highlightIndex?: number }): JSX.Element
  ```
- Desenho: uma `Stave` por linha, com clave e armadura na primeira linha e fórmula de compasso só na primeira. `Accidental` para os acidentes das notas, `Dot.buildAndAttach` para o ponto, `BarNote` ou nova linha para `bar`. SVG responsivo como no `NoteStaff` (viewBox + width 100%). Cores lidas por `readToken('text')`, com redraw quando `highContrast` muda. `maxPerLine`: 8 elementos em telas < 480 px (via `matchMedia`), 16 nas demais.

- [ ] **Step 1: testes que falham:** `vexDuration('h',1)==='hd'`, `vexDuration('q',0,true)==='qr'`, `vexDuration('8',1,true)==='8dr'`. `describeScore` com clave de fá, 4/4 e uma pausa gera o texto esperado (escreva-o no teste). `splitIntoLines` com 20 notas e barras a cada 4 quebra nas barras sem passar de 8 por linha. Render de `ScoreView` em jsdom: há um `svg` dentro de um elemento com `role="img"` e `aria-label` igual a `describeScore`. Nota Dó4 na clave de fá: a StaveNote recebe `clef: 'bass'` (spy em `StaveNote` ou checagem do resultado de `buildElements` exportado).
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** testes, lint e build passam.
- [ ] **Step 5:** verificação no navegador, se houver ferramentas (preview `leitura-musical-app`, porta 5180): renderize um exemplo temporário numa rota de teste ou num componente de dev e confira clave de fá, armadura com 2♯, compasso 3/4, mínima pontuada e pausa. Remova o código temporário antes do commit.
- [ ] **Step 6:** commit `feat(teoria): pauta genérica com armadura, compasso, pausas e ponto`.

---

### Task 3: Geradores — conceito, notas, figuras, compasso

**Files:** Create `src/theory/generators/concept.ts`, `noteName.ts`, `figureValue.ts`, `measureFill.ts`, `src/theory/generators/conceptBanks.ts`, `src/theory/generators/assertions.ts` (helpers de teste compartilhados) e um `*.test.ts` para cada gerador.

**Interfaces:**
- Consumes: Task 1.
- Produces: `export const concept: Generator`, `noteName`, `figureValue`, `measureFill` (exports nomeados, cada um no seu arquivo). `assertions.ts` exporta `checkQuestionInvariants(q: Question)`, que verifica 3 a 4 opções, opções distintas, `0 <= answer < options.length`, prompt e explicação não vazios, e `expectAnswerPositionsVary(gen, params, n)`.
- Parâmetros e regras:
  - **`concept`:** `params.bank: 'properties' | 'dynamics'`.
    - `conceptBanks.ts` traz 12 ou mais itens originais por banco, cada um `{ prompt, correct, distractors: string[3], explanation }`.
    - `properties`: altura, duração, intensidade e timbre.
    - `dynamics`: pp, p, mp, mf, f, ff, crescendo, diminuendo, e andamentos como Largo, Adagio, Andante, Moderato e Allegro, com significado em português.
  - **`noteName`:** `params: { clef: 'treble'|'bass'; low: string; high: string; accidentals?: boolean }`.
    - Mostra `score` com uma semibreve.
    - As opções são nomes em solfejo; com `accidentals`, a nota pode ter ♯ ou ♭.
    - **Nunca** aparecem opções enarmônicas entre si (por exemplo Dó♯ e Ré♭ juntas), nem enarmônicas da resposta.
  - **`figureValue`:** `params: { include: Duration[]; rests: boolean; dotted: boolean }`.
    - Alterna "Qual é esta figura/pausa?" (opções: semibreve, mínima, semínima, colcheia, com "pausa de …" quando for pausa) e "Quantos tempos vale?", com semínima = 1 e opções numéricas como "1½".
  - **`measureFill`:** `params: { timeSignature: '2/4'|'3/4'|'4/4' }`.
    - Mostra um compasso incompleto, faltando de ½ a 2 tempos, e pergunta qual figura o completa.
    - As opções são nomes de figura, com uma única resposta que completa exatamente.

- [ ] **Step 1: testes que falham.** Para cada gerador: 200 sementes passam por `checkQuestionInvariants`, e a posição da resposta varia (pelo menos 3 posições diferentes). Testes específicos:
  - `noteName` com clef `bass`, low `G2`, high `C4`: a resposta é o solfejo da nota mostrada em `score.elements[0]`, e a nota está dentro do range.
  - `noteName` com `accidentals`: nenhum par de opções tem o mesmo `pitchToMidi % 12`.
  - `figureValue` com `dotted`: a pergunta de tempos sobre uma mínima pontuada tem resposta "3".
  - `measureFill` com 3/4: a soma de `noteBeats` dos elementos mais a figura da resposta é 3; nenhuma outra opção soma 3.
  - `concept`: os bancos têm ≥ 12 itens, sem prompts duplicados.
  - Um snapshot exato com `mulberry32(1)` para cada gerador.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** testes, lint e build passam.
- [ ] **Step 5:** commit `feat(teoria): geradores de conceito, notas, figuras e compasso`.

---

### Task 4: Geradores — intervalos, escalas, armaduras

**Files:** Create `src/theory/generators/interval.ts`, `scale.ts`, `keySignature.ts` e um `*.test.ts` para cada.

**Interfaces:**
- Consumes: Task 1 (`intervalBetween`, `intervalName`, `majorScale`, `MAJOR_KEYS`) e `checkQuestionInvariants`, que a Task 3 cria. Esta tarefa roda em paralelo com a 3: se `assertions.ts` ainda não existir, crie uma cópia local `src/theory/generators/assertions.local.ts` com a mesma assinatura; o controlador unifica as duas depois.
- Produces:
  - `export const interval: Generator`
    - `params: { withQuality: boolean; clef: 'treble'|'bass'; maxNumber?: number }`, onde `maxNumber` vale 8 por padrão e 2 na lição de tom e semitom.
    - Duas notas em semibreve, uma depois da outra (melódico ascendente).
    - Sem qualidade, as opções são números ("2ª", "3ª" …).
    - Com qualidade, só maior, menor e justa, e a 4ª aumentada / 5ª diminuta não aparecem.
    - Na lição 8, com `maxNumber: 2` e `withQuality`, a pergunta é "tom ou semitom?": a 2ª maior é tom e a 2ª menor é semitom.
  - `export const scale: Generator`
    - `params: { keys: string[] }`, com nomes de `MAJOR_KEYS`.
    - Duas variantes. Na primeira, mostra a escala com um grau trocado por "?" e pergunta qual nota falta, com opções em solfejo e acidentes. Na segunda, mostra a escala completa e pergunta qual escala maior é.
  - `export const keySignature: Generator`
    - `params: { maxAccidentals: number }`.
    - `score` com a `keySignature` e nenhuma nota. As opções são nomes de tonalidade maior.

- [ ] **Step 1: testes que falham:**
  - 200 sementes por gerador passam pelas invariantes.
  - A resposta de `interval` é igual a `intervalName(intervalBetween(...))` calculado a partir das notas do `score`.
  - A resposta de `scale` (nota faltante) é igual a `majorScale(tonic)[grau]`.
  - A resposta de `keySignature` corresponde a `MAJOR_KEYS` pelo `vexKey` do score.
  - Com `maxNumber 2`, toda resposta é "Tom" ou "Semitom", e a resposta está correta pelos semitons (2 → Tom, 1 → Semitom).
  - Snapshot com `mulberry32(1)`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** testes, lint e build passam.
- [ ] **Step 5:** commit `feat(teoria): geradores de intervalos, escalas e armaduras`.

---

### Task 5: Stores, codec de hinos e hinos em domínio público

**Files:** Create `src/store/useProgressStore.ts`, `src/store/useProgressStore.test.ts`, `src/store/useHymnStore.ts`, `src/store/useHymnStore.test.ts`, `src/hymns/codec.ts`, `src/hymns/codec.test.ts`, `src/hymns/publicDomain.ts`, `src/hymns/publicDomain.test.ts`, `src/hymns/measures.ts`

**Interfaces — Produces:**
```ts
// useProgressStore.ts — persist name 'leitura-musical-progress', version 1
interface ProgressState {
  best: Record<string, number>                 // chave `${lessonId}/${exerciseId}` → melhor nota 0..10
  recordScore(lessonId: string, exerciseId: string, score: number): void   // só sobe
  bestScore(lessonId: string, exerciseId: string): number | undefined
  lessonStatus(lesson: { id: string; exercises: { id: string }[] }): 'novo' | 'andamento' | 'concluida'
  reset(): void
}
export const PASS_SCORE = 7
// useHymnStore.ts — persist 'leitura-musical-hymns', version 1
export interface UserHymn { id: string; title: string; clef: 'treble' | 'bass'; notes: Note[]; updatedAt: number }
interface HymnState {
  hymns: UserHymn[]
  save(h: Omit<UserHymn, 'id' | 'updatedAt'> & { id?: string }): string   // retorna id
  remove(id: string): void
  get(id: string): UserHymn | undefined
}
export const MAX_HYMN_NOTES = 400
// codec.ts
export function encodeHymn(h: Pick<UserHymn, 'title' | 'clef' | 'notes'>): string  // 'LM1:' + base64url(JSON)
export function decodeHymn(code: string): Pick<UserHymn, 'title' | 'clef' | 'notes'>  // lança Error('invalid')
// measures.ts
export function measuresClose(notes: { duration: Duration; dots?: 0|1 }[], beatsPerMeasure: number, pickupBeats?: number): boolean
// publicDomain.ts
export interface PublicDomainHymn { id: string; title: string; origin: string; year: number; timeSignature: '3/4' | '4/4'; pickupBeats: number; piece: Piece }
export const PUBLIC_DOMAIN_HYMNS: PublicDomainHymn[]  // old-hundredth, new-britain, hino-da-alegria
```
- Stores: `merge` com try/catch e validação de forma. Um estado inválido volta ao estado inicial, sem lançar erro.
- Hinos embutidos: transcreva com cuidado a primeira frase completa (primeira estrofe) de cada melodia, em Sol3–Sol5, clave de sol:
  - Old Hundredth: Sol maior, 4/4, mínimas e semibreves;
  - New Britain: Sol maior, 3/4, anacruse de 1 tempo;
  - Hino da Alegria: Ré maior ou Dó maior, 4/4, semínimas, com a mínima pontuada mais semínima no fim das frases.
  - Use `accidental` nas notas alteradas pela tonalidade (Fá♯ em Sol maior), porque o motor compara só o nome.
  - Sem letra.
  - Coloque num comentário a fonte de domínio público da melodia (compositor e ano).

- [ ] **Step 1: testes que falham:**
  - `recordScore` 8, depois 5 → `bestScore` 8.
  - `lessonStatus`: sem notas → 'novo'; uma ≥ 7 de duas → 'andamento'; todas ≥ 7 → 'concluida'.
  - Store com JSON corrompido no localStorage hidrata sem lançar erro e com `best = {}`.
  - CRUD de hinos.
  - `encodeHymn` → `decodeHymn` ida e volta; rejeita `'XX:abc'`, base64 quebrado, JSON sem `notes` e 401 notas.
  - `measuresClose([h,h,w], 4) === true`; `measuresClose([q,h], 4) === false`; com `pickupBeats: 1` e 3/4, `[q, h, q, h, q, h]` fecha.
  - Cada hino embutido: `measuresClose(piece.notes, beats, pickupBeats)`, `year < 1900`, notas entre Sol3 e Sol5, sem pausas.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** testes, lint e build passam.
- [ ] **Step 5:** commit `feat(hinos): stores de progresso e hinos, codec e melodias em domínio público`.

---

### Task 6: Conteúdo das 12 lições, currículo e registro de geradores

**Files:** Create `src/theory/lessons/*.ts` (12 arquivos, um por id da Seção 5 do spec), `src/theory/curriculum.ts`, `src/theory/generators/index.ts`, `src/theory/curriculum.test.ts`

**Interfaces:**
- Consumes: todos os geradores (Tasks 3 e 4) e os tipos (Task 1).
- Produces:
  ```ts
  // generators/index.ts
  export const GENERATORS: Record<ExerciseType, Generator>
  // curriculum.ts
  export const CURRICULUM: Lesson[]                 // na ordem da Seção 5
  export function getLesson(id: string): Lesson | undefined
  export function getExercise(lessonId: string, exerciseId: string): ExerciseSpec | undefined
  ```
- Conteúdo:
  - Siga a tabela da Seção 5 do spec: títulos, ids, exercícios com `params` e leituras.
  - Texto **original**, com 3 a 7 blocos por lição e frases curtas. Pelo menos um bloco `score` em todas as lições, exceto a 1. Use `table` para valores de figuras e `tip` para dicas.
  - Nunca copie texto do MSA nem de outro livro.
  - As leituras são `Piece` (id `leitura-<lessonId>`, título "Leitura — <título>"), só com notas, 8 a 16 notas, dentro do que a lição ensinou. Use mínima pontuada na lição 6 e Fá♯ com `accidental: '#'` na lição 10 (Sol maior).
  - Se `assertions.local.ts` existir (Task 4), unifique-a com `assertions.ts` e remova a cópia.

- [ ] **Step 1: testes que falham** em `curriculum.test.ts`:
  - 12 lições, ids da Seção 5 em ordem, `order` 1..12, ids únicos.
  - Cada lição tem pelo menos um exercício, todo `type` existe em `GENERATORS`, e cada gerador roda 10 vezes com `mulberry32(i)` passando por `checkQuestionInvariants`.
  - As leituras só têm notas, entre 8 e 16, e `noteBeats` funciona em todas.
  - Todo bloco `score` com `timeSignature` fecha os compassos (`measuresClose` sobre as notas e pausas entre barras).
  - `getLesson('xyz') === undefined`.
  - Nenhum bloco de texto vazio.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** testes, lint e build passam.
- [ ] **Step 5:** commit `feat(teoria): trilha de 12 lições originais e registro de geradores`.

---

### Task 7: Blocos de lição e cartão de pergunta

**Files:** Create `src/components/LessonBlocks.tsx`, `src/components/LessonBlocks.test.tsx`, `src/components/QuestionCard.tsx`, `src/components/QuestionCard.test.tsx`

**Interfaces:**
- Consumes: `ScoreView` (Task 2), `Block` e `Question` (Task 1), componentes de `ui/`.
- Produces:
  ```ts
  export function LessonBlocks(props: { blocks: Block[]; highContrast: boolean }): JSX.Element
  // text: <p> com **negrito** convertido em <strong> (sem dangerouslySetInnerHTML); table: <table> com <th>; tip: Card com IconBox Lightbulb; score: ScoreView + caption
  export function QuestionCard(props: { question: Question; index: number; total: number; highContrast: boolean;
    onAnswer: (correct: boolean) => void; onNext: () => void }): JSX.Element
  // antes de responder: opções como botões; ao tocar: trava, marca certa (var(--success)) e escolhida errada (var(--error)) com texto "Certo!"/"Resposta: X",
  // mostra explanation e botão "Próxima" (ou "Ver resultado" na última). Contador "3 / 10". aria-live na região do feedback.
  ```
- [ ] **Step 1: testes que falham:**
  - `**Clave**` vira `<strong>Clave</strong>`.
  - A tabela renderiza os cabeçalhos.
  - Clicar na opção errada chama `onAnswer(false)`, mostra "Resposta:" com o texto certo e a explicação, e desabilita as opções.
  - Clicar na certa chama `onAnswer(true)` e mostra "Certo!".
  - "Próxima" chama `onNext`.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** testes, lint e build passam.
- [ ] **Step 5:** commit `feat(teoria): blocos de lição e cartão de pergunta`.

---

### Task 8: Telas de teoria

**Files:** Create `src/routes/Theory.tsx`, `src/routes/Lesson.tsx`, `src/routes/Exercise.tsx`, `src/routes/theory.test.tsx`

**Interfaces:**
- Consumes: `CURRICULUM`, `getLesson`, `getExercise`, `GENERATORS` (Task 6); `LessonBlocks` e `QuestionCard` (Task 7); `useProgressStore` e `PASS_SCORE` (Task 5); `mulberry32` e `randomSeed` (Task 1); `usePracticeStore` (para `highContrast`).
- Produces: componentes `Theory`, `Lesson` e `Exercise` (exports nomeados). **Não** altere `App.tsx`, porque a Task 10 liga as rotas. Nos testes, use `MemoryRouter` com as rotas locais.
- Telas:
  - **`Theory`:** título "Teoria musical", subtítulo "Lições na sequência do MSA, com textos próprios do app.", e lista de `Card`s com número, título, resumo e `Badge` de status ("Concluída", "Em andamento" ou nada).
  - **`Lesson`:** título, `LessonBlocks`, seção "Exercícios" com um botão por exercício mostrando "Melhor: 8/10" e, se houver leitura, o botão "Leitura métrica", que navega para `/praticar` com `state: { piece: lesson.reading }`. No fim, links para a lição anterior e a próxima. Id inválido mostra "Lição não encontrada".
  - **`Exercise`:** gera 10 perguntas com `mulberry32(seed)` no mount, com a semente em estado e uma prop opcional `seed` para teste. Mostra o `QuestionCard`. Ao final, mostra a nota, a mensagem ("Muito bem!" se ≥ 7, senão "Revise a lição e tente de novo") e os botões "Refazer" (nova semente) e "Voltar à lição". Chama `recordScore`.
- [ ] **Step 1: testes que falham:**
  - `Theory` lista 12 títulos em ordem.
  - `Lesson` 'compasso' mostra o título e o botão do exercício.
  - `Lesson` 'xyz' mostra "Lição não encontrada".
  - `Exercise` com `seed=1`: responder as 10 perguntas sempre na opção `answer` grava 10 no store e mostra "10 / 10".
  - Botão "Leitura métrica" navega com `state.piece` (use uma rota `/praticar` fake no `MemoryRouter`).
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** testes, lint e build passam.
- [ ] **Step 5:** commit `feat(teoria): telas da trilha, da lição e do exercício`.

---

### Task 9: Telas de hinos

**Files:** Create `src/routes/Hymns.tsx`, `src/routes/HymnEditor.tsx`, `src/routes/hymns.test.tsx`

**Interfaces:**
- Consumes: `PUBLIC_DOMAIN_HYMNS`, `encodeHymn`, `decodeHymn`, `useHymnStore` e `MAX_HYMN_NOTES` (Task 5); `ScoreView` (Task 2); `ui/`.
- Produces: componentes `Hymns` e `HymnEditor` (exports nomeados). Não altere `App.tsx`.
- **`Hymns`:**
  - Aviso fixo: "Por direitos autorais, o app não traz os hinos do Hinário. Digite no editor a melodia do hino que você está estudando — ela fica salva só neste aparelho."
  - Seção "Melodias tradicionais (domínio público)", com cards mostrando título, origem e ano e o botão "Praticar".
  - Seção "Meus hinos", com "Novo hino" e, para cada hino, "Praticar", "Editar" e "Excluir" (com `window.confirm`).
  - "Importar código": campo de texto mais botão, com erro "Código inválido ou de versão diferente".
  - "Praticar" navega para `/praticar` com `state: { piece }`, onde o piece tem `id`, `title`, `level: 1`, `clef` e `notes`.
- **`HymnEditor`** (`/hinos/novo` e `/hinos/:id/editar`):
  - Campos de título e clave.
  - Teclado com 7 botões Dó–Si, oitava − e + (3 a 5, mostrando a atual), duração (Semibreve, Mínima, Semínima, Colcheia), Ponto (toggle), ♯ e ♭ (toggles que valem para a próxima nota), Desfazer e Limpar.
  - Prévia com `ScoreView` mostrando as últimas 16 notas e o total de notas.
  - "Salvar" (desabilitado com 0 notas; título vazio vira "Sem título"), "Praticar" e "Copiar código" (clipboard, com fallback de mostrar o código num campo selecionável).
  - Limite de `MAX_HYMN_NOTES`: ao atingir, os botões de nota ficam desabilitados com aviso.
  - Id inexistente mostra "Hino não encontrado".
- [ ] **Step 1: testes que falham:**
  - `Hymns` mostra os 3 embutidos e o aviso.
  - O editor adiciona Sol (semínima), Lá (mínima pontuada) e Desfazer → 1 nota; Salvar → store com 1 hino `{ step:'G', duration:'q' }`.
  - Com Ponto e Mínima, o editor salva `dots: 1`.
  - Importar um código válido cria um hino; um código inválido mostra o erro.
  - Excluir com confirm `true` remove o hino.
- [ ] **Step 2:** FAIL. **Step 3:** implementar. **Step 4:** testes, lint e build passam.
- [ ] **Step 5:** commit `feat(hinos): melodias tradicionais, meus hinos e editor`.

---

### Task 10: Rotas, entrada na Início e verificação

**Files:** Modify `src/App.tsx`, `src/routes/Home.tsx`, `README.md`; Create `src/routes/app.routes.test.tsx`

- [ ] **Step 1:** Em `App.tsx`, adicione as rotas `/teoria`, `/teoria/:lessonId`, `/teoria/:lessonId/exercicio/:exerciseId`, `/hinos`, `/hinos/novo` e `/hinos/:id/editar`.
- [ ] **Step 2:** Em `Home.tsx`, antes de "Melodias conhecidas", adicione uma seção com dois `Card`s interativos lado a lado no desktop e empilhados no celular:
  - "Teoria musical", ícone `BookOpen`, com "12 lições na sequência do MSA, com exercícios";
  - "Hinos", ícone `Music2`, com "Melodias tradicionais e o editor para os seus hinos".
- [ ] **Step 3:** teste de rotas que falha e depois passa: renderize `App` com `MemoryRouter` em `/teoria` e em `/hinos` e encontre os títulos.
- [ ] **Step 4:** README: adicione a seção "Teoria e hinos" (conteúdo original, nota sobre direitos autorais, onde editar a ordem das lições).
- [ ] **Step 5:** `npm test`, `npm run lint` e `npm run build` passam.
- [ ] **Step 6:** verificação no navegador (preview `leitura-musical-app`): Início → Teoria → lição 5 → exercício completo → nota gravada → trilha mostra o status; Hinos → novo hino → praticar. Faça isso em 375 px e no desktop, no tema claro e no alto contraste, sem rolagem horizontal e sem erros no console.
- [ ] **Step 7:** commit `feat: entrada de teoria e hinos na Início e rotas`.
