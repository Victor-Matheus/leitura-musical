# Módulo de teoria (MSA) e hinos — Design

**Data:** 2026-10-11
**Status:** decisões tomadas com o Victor em conversa; execução autônoma autorizada
**Escopo:** subprojeto 2. O motor de voz e o redesign já estão em produção (PR #5).

## 1. Objetivo

Ajudar alunos da CCB nas aulas teóricas do MSA (Método Simplificado de Aprendizagem
Musical) com quatro coisas:

- uma **trilha de lições** curtas;
- **exercícios** com correção imediata;
- **leitura métrica** no andamento, usando o motor de voz existente;
- **prática de hinos**.

O app continua 100% client-side, sem login, com foco no celular.

**Critério de sucesso:** um aluno abre "Teoria", segue a trilha na ordem, lê a lição e faz
os exercícios. Ele vê o que errou e por quê, e a lição fica marcada como concluída. Na
seção "Hinos", ele pratica uma melodia embutida ou digita a do hino que está estudando.

## 2. Direitos autorais (restrição de conteúdo)

- O texto do MSA e as partituras e letras do Hinário 5 são material protegido da CCB e
  **não são reproduzidos**.
- As lições são **textos originais** que cobrem os tópicos de teoria (conhecimento comum)
  na progressão habitual do método. Elas não citam números de página, não copiam
  exercícios do método e não usam frases do MSA.
- Os hinos embutidos são **só melodias em domínio público**, com título, compositor e ano
  de origem. As letras não entram.
- A melodia de qualquer outro hino entra pelo **editor**, digitada pelo próprio usuário
  e salva só no aparelho dele.
- Um texto fixo na seção de hinos explica isso.

## 3. Decisões

| Tema | Decisão |
|---|---|
| Conteúdo | 12 lições originais, em arquivos TypeScript de dados (`src/theory/lessons/`), na ordem da Seção 5. A ordem fica num único array (`src/theory/curriculum.ts`), fácil de reordenar. |
| Exercícios | Quatro famílias: notas na pauta; figuras, pausas e valores; intervalos, escalas e armaduras; leitura métrica no andamento. |
| Progresso | No aparelho (zustand + persist, chave `leitura-musical-progress`): melhor pontuação por exercício e lição concluída. |
| Hinos | Três melodias em domínio público embutidas, mais um editor com armazenamento local (chave `leitura-musical-hymns`) e exportar/importar como texto. |
| Navegação | Novos cards na Início: "Teoria musical" e "Hinos". |

## 4. Arquitetura

```
src/theory/
  types.ts           Lesson, Block, ExerciseSpec, Question, ScoreElement
  curriculum.ts      ordem das lições (array de ids) + getLesson(id)
  lessons/*.ts       uma lição por arquivo (conteúdo original)
  rng.ts             gerador pseudoaleatório com semente (mulberry32)
  generators/        um gerador puro por tipo de exercício
    noteName.ts  figureValue.ts  measureFill.ts  interval.ts  scale.ts  keySignature.ts
  music.ts           utilitários puros: semitons, intervalos, escala maior, armaduras
src/hymns/
  publicDomain.ts    melodias embutidas (Piece + metadados)
  codec.ts           exportar/importar hino como texto (JSON versionado)
src/store/
  useProgressStore.ts   progresso das lições
  useHymnStore.ts       hinos do usuário
src/components/
  ScoreView.tsx      pauta VexFlow genérica (clave, armadura, fórmula, notas, pausas, ponto, barras)
  LessonBlocks.tsx   renderiza os blocos de uma lição
  QuestionCard.tsx   pergunta de múltipla escolha com feedback e explicação
src/routes/
  Theory.tsx         /teoria — trilha
  Lesson.tsx         /teoria/:lessonId — leitura da lição + exercícios + leitura métrica
  Exercise.tsx       /teoria/:lessonId/exercicio/:exerciseId — 10 perguntas
  Hymns.tsx          /hinos — embutidos + meus hinos
  HymnEditor.tsx     /hinos/novo e /hinos/:id/editar
```

### 4.1 Tipos principais

```ts
type ScoreElement =
  | { kind: 'note'; note: Note }                        // Note do motor (step, octave, accidental?, duration, dots?)
  | { kind: 'rest'; duration: Duration; dots?: 0 | 1 }
  | { kind: 'bar' }

type Block =
  | { kind: 'text'; text: string }                      // parágrafo; **negrito** simples
  | { kind: 'score'; clef: 'treble' | 'bass'; keySignature?: string; timeSignature?: string;
      elements: ScoreElement[]; caption?: string }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'tip'; text: string }                       // destaque "Dica"

interface ExerciseSpec { id: string; title: string; type: ExerciseType; params: Record<string, unknown> }
type ExerciseType = 'concept' | 'noteName' | 'figureValue' | 'measureFill' | 'interval' | 'scale' | 'keySignature'

interface Question {
  prompt: string
  score?: Omit<Extract<Block, { kind: 'score' }>, 'kind'>
  options: string[]          // 3 ou 4 opções, sem repetição
  answer: number             // índice correto
  explanation: string        // mostrada após responder
}

interface Lesson {
  id: string; order: number; title: string; summary: string
  blocks: Block[]
  exercises: ExerciseSpec[]  // 1 ou 2
  reading?: Piece            // leitura métrica opcional (só notas, sem pausas)
}
```

- `Note` ganha o campo opcional `dots?: 0 | 1`.
- `durationBeats` passa a se chamar `noteBeats(note)` e considera o ponto (× 1,5).
- `timeline.ts` usa `noteBeats`. Nada mais do motor muda.

### 4.2 Geradores

Cada gerador é uma função pura `(params, rng) => Question`. A tela de exercício cria 10
perguntas com `rng = mulberry32(seed)`, com a semente gerada ao abrir. Nos testes, a
semente é fixa.

| Tipo | O que pergunta | params |
|---|---|---|
| `concept` | pergunta conceitual sorteada de um banco fixo e original | `bank: 'properties' \| 'dynamics'` |
| `noteName` | nome de uma nota mostrada na pauta | `clef`, `range: [lowNote, highNote]` |
| `figureValue` | nome da figura ou da pausa, ou quantos tempos vale (semínima = 1) | `include: Duration[]`, `rests: boolean`, `dotted: boolean` |
| `measureFill` | qual figura completa o compasso mostrado | `timeSignature` (2/4, 3/4, 4/4) |
| `interval` | número do intervalo (2ª a 8ª) e, a partir da lição 9, a classificação (maior, menor, justa) | `withQuality: boolean`, `clef` |
| `scale` | qual nota completa a escala maior mostrada, ou qual é a escala | `keys: string[]` |
| `keySignature` | tonalidade maior pela armadura | `maxAccidentals: number` (até 4) |

Regras para todos os geradores:
- As opções são distintas e contêm a resposta.
- A resposta não fica sempre na mesma posição.
- A explicação diz por que a resposta é correta.

### 4.3 Fluxo

1. **Trilha:** `/teoria` lista as lições na ordem, com status: não iniciada, em andamento
   ou concluída.
2. **Lição:** `/teoria/:id` mostra os blocos, depois os botões dos exercícios (com a melhor
   pontuação) e, se houver, "Leitura métrica".
3. **Exercício:** para cada pergunta, o aluno toca numa opção. A opção certa fica verde e a
   errada vermelha, a explicação aparece e o botão "Próxima" avança. No fim aparecem a
   pontuação, "Refazer" e "Voltar à lição". A melhor pontuação é gravada.
4. **Conclusão da lição:** a lição fica concluída quando todos os exercícios dela tiverem
   melhor pontuação ≥ 7/10.
5. **Leitura métrica:** navega para `/praticar` com `state: { piece }`, o mesmo contrato da
   Início.

### 4.4 Hinos

- **Embutidos** (`publicDomain.ts`), cada um com `{ id, title, origin, year, timeSignature, pickupBeats }` e um `Piece`
  em clave de sol, só com notas (sem pausas):
  - "Old Hundredth" (Genebra, Louis Bourgeois, 1551);
  - "New Britain" (melodia tradicional americana, 1829);
  - "Hino da Alegria" (Ludwig van Beethoven, 1824, tema da 9ª Sinfonia).
  Somente a primeira estrofe da melodia.
- **Editor**:
  - teclado de notas (Dó a Si), botões de oitava (3 a 5), duração (semibreve, mínima,
    semínima, colcheia), ponto, sustenido e bemol, desfazer e limpar;
  - campos de título e clave;
  - prévia ao vivo com `ScoreView`;
  - salvar, praticar (vai para `/praticar`) e excluir (com confirmação).
- **Exportar e importar**:
  - "Copiar código" gera o texto `LM1:` seguido de JSON em base64url.
  - "Importar" aceita esse texto, valida (versão, campos, limites) e mostra um erro claro
    quando é inválido.

## 5. Trilha (conteúdo original, nesta ordem)

| # | id | Título | Exercícios | Leitura |
|---|---|---|---|---|
| 1 | `som` | O som e suas propriedades | `concept` (bank `properties`) | — |
| 2 | `pauta-clave-sol` | Pauta, notas e clave de sol | `noteName` (sol, Dó4–Sol4) | Dó–Sol, semínimas |
| 3 | `clave-fa` | Clave de fá | `noteName` (fá, Sol2–Dó4) | — |
| 4 | `figuras-pausas` | Figuras de valor e pausas | `figureValue` (w/h/q/8, com pausas) | mínimas e semínimas |
| 5 | `compasso` | Compasso e fórmula de compasso | `measureFill` (2/4, 3/4, 4/4) | 3/4 com mínima |
| 6 | `ponto-ligadura` | Ponto de aumento e ligadura | `figureValue` (dotted) | mínima pontuada |
| 7 | `acidentes` | Sustenido, bemol e bequadro | `noteName` (sol, com acidentes) | — |
| 8 | `tom-semitom` | Tom e semitom | `interval` (sem qualidade, 2ª) | — |
| 9 | `intervalos` | Intervalos | `interval` (com qualidade) | — |
| 10 | `escala-maior` | Escala maior | `scale` | escala de Sol maior |
| 11 | `armaduras` | Armadura de clave e tonalidades | `keySignature` (até 4) | — |
| 12 | `andamento-dinamica` | Andamento e dinâmica | `concept` (bank `dynamics`: p, mf, f, cresc., dim., andamentos) | — |

Os bancos do `concept` têm pelo menos 12 perguntas originais cada. As opções são
embaralhadas pelo rng.

Cada lição tem entre 3 e 7 blocos, frases curtas e pelo menos um exemplo na pauta (exceto
na lição 1). O texto é em pt-BR, acessível a jovens iniciantes.

## 6. Erros e bordas

- `/teoria/:id` com id inexistente → mensagem "Lição não encontrada" com link para a trilha.
- Os mesmos casos para exercício e hino.
- Hino salvo com 0 notas: "Praticar" e "Salvar" ficam desabilitados.
- Título vazio vira "Sem título".
- Importação inválida mostra "Código inválido ou de versão diferente" e não altera nada.
- Limite de 400 notas por hino.
- Progresso corrompido no localStorage → reinicia sem quebrar a tela (try/catch no
  `merge` do persist).
- Acessibilidade:
  - opções de resposta como botões com `aria-pressed` e texto;
  - o feedback de certo ou errado tem texto, não só cor;
  - toda pauta tem `aria-label` com a descrição textual (por exemplo "Nota Sol na clave
    de sol").

## 7. Testes

- **`music.ts`:** semitons entre notas; intervalos (número e qualidade) para 20 casos
  conhecidos; escala maior de Dó, Sol, Ré, Fá e Si♭; armaduras de até 4 acidentes.
- **Geradores:** para cada tipo, 200 perguntas com sementes diferentes. Opções distintas,
  resposta dentro das opções e certa segundo `music.ts`, e posição da resposta variando.
  Também uma pergunta exata com semente fixa.
- **Conteúdo:**
  - cada lição do `curriculum` existe, com ordem única e `id` único;
  - tem ao menos um exercício cujo tipo existe;
  - os `params` de cada exercício são válidos (o gerador roda 10 vezes sem erro);
  - a leitura, quando existe, só tem notas;
  - os blocos `score` têm durações que fecham os compassos quando há `timeSignature`.
- **Hinos embutidos:**
  - durações fecham os compassos declarados, descontada a anacruse (`pickupBeats`) no
    início e o seu complemento no fim;
  - notas dentro de Sol3–Sol5;
  - origem e ano preenchidos com ano < 1900.
- **`codec`:** ida e volta; rejeição de prefixo errado, JSON quebrado e excesso de notas.
- **Stores:**
  - melhor pontuação só sobe;
  - conclusão quando todos os exercícios ≥ 7;
  - CRUD de hinos;
  - estado corrompido é recuperado.
- **Telas** (Testing Library):
  - trilha lista 12 lições em ordem;
  - exercício completo de 10 perguntas com semente fixa grava a pontuação;
  - editor adiciona notas, desfaz e salva.
- **Revisão de conteúdo:** uma revisão dedicada de correção musical (teoria e melodias)
  antes do merge.
- **Verificação visual** no navegador em 375 px e desktop, tema claro e alto contraste.

## 8. Fora de escopo

- Reproduzir textos do MSA ou do Hinário.
- Letras de hinos.
- Áudio (tocar a melodia).
- Leitura com pausas no motor de voz.
- Ligaduras de valor na leitura.
- Contas e sincronização entre aparelhos.
- Clave de dó.
- Escalas menores.
