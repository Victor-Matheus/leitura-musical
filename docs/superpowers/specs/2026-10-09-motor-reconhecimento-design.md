# Motor de reconhecimento de notas — Design

**Data:** 2026-10-09
**Status:** aprovado em conversa, aguardando revisão do documento
**Escopo:** subprojeto 1 de 2. O módulo de teoria (método CCB/MSA) terá ciclo próprio.

## 1. Contexto e objetivo

O Leitura Musical é um app web (React + Vite, sem backend, hospedado na Vercel) para
estudantes treinarem leitura de notas, com foco no método da CCB. O aluno fala o nome das
notas (dó, ré, mi…) **no andamento**, como na leitura métrica do MSA, enquanto o app passa as
notas no BPM escolhido.

**Problema:** o reconhecimento atrasa, "encavala" respostas nas notas seguintes e nunca
sincroniza com o que o aluno acabou de falar.

**Público:** principalmente celular, com iPhone e Android misturados.

**Critério de sucesso:** a sílaba falada é atribuída à nota que estava na tela no momento em
que foi falada, mesmo quando o resultado do reconhecimento chega atrasado. O feedback visual
aparece enquanto a nota ainda está na tela na maioria dos casos (latência p90 < 500 ms no
motor principal).

## 2. Causas do problema atual

Em `src/engine/useSpeechNotes.ts` e `src/routes/Practice.tsx`:

1. **Reprocessamento da transcrição inteira.** Com `continuous + interimResults`, cada evento
   traz o texto acumulado. O código pega a última palavra, que ainda é a sílaba anterior
   quando a nova não foi transcrita. Ela é disparada de novo e cai na nota seguinte.
2. **Sem controle de palavras já consumidas.** Só há um debounce global de 350 ms, então a
   mesma sílaba conta como parcial e como final.
3. **Atribuição pela hora de chegada.** A Web Speech API processa na nuvem com atraso de
   0,5 a 2 s, variável. A "janela de graça" (≤ 800 ms) não cobre esse atraso.
4. **Passador em `setTimeout` encadeado**, que acumula atraso e não compartilha relógio com o
   áudio.
5. `matchSpokenNote` aceita prefixos e sinônimos frouxos ("o" → dó, "e" → ré), gerando falsos
   positivos.

## 3. Decisões

| Decisão | Escolha |
|---|---|
| Modo de uso | Aluno fala no andamento; o app não espera. |
| Critério de acerto | Nome certo dentro da janela da nota (sem medir precisão rítmica). |
| Motor principal | Vosk (WASM, modelo pt-BR pequeno) com vocabulário restrito às 7 sílabas, condicionado ao spike. |
| Plano B | Detector de início de fala no aparelho + Web Speech com consumo incremental. |
| Relógio | `AudioContext.currentTime` como relógio único para notas e sílabas. |
| Pulso para o aluno | Visual (indicador por tempo). Sem clique de metrônomo por padrão. |

## 4. Arquitetura

Todas as unidades são novas, salvo indicação.

| Unidade | Responsabilidade | Depende de |
|---|---|---|
| `src/audio/micInput.ts` | Abre o microfone (`echoCancellation`, `noiseSuppression`, `autoGainControl`), cria e retoma o `AudioContext` e entrega blocos PCM com o horário de cada bloco no relógio único (via AudioWorklet). | API do navegador |
| `src/recognition/types.ts` | Interface `NoteRecognizer`: `start()`, `stop()`, evento `syllable { step: Step; onset: number }` (segundos no relógio único), `status: 'loading' \| 'ready' \| 'error'`, e `kind: 'local' \| 'online'`. | — |
| `src/recognition/syllables.ts` | Normalização e tabela de sinônimos. Substitui `src/engine/noteMatcher.ts`. Só casa palavras inteiras, sem regra de prefixo. | — |
| `src/recognition/voskRecognizer.ts` | Motor principal. Vosk num Web Worker com gramática `["do","re","mi","fa","sol","la","si","[unk]"]` e horários por palavra ativados. Converte o horário de cada palavra para o relógio único: `onset = inicioDoStream + word.start`. | `micInput`, `vosk-browser` |
| `src/recognition/onsetDetector.ts` | Detector de início de fala por energia (RMS com limiar adaptativo e tempo mínimo de silêncio entre falas). Emite `onset` no relógio único. | `micInput` |
| `src/recognition/webSpeechRecognizer.ts` | Plano B. Web Speech com consumo incremental: guarda quantas palavras de cada `resultIndex` já foram emitidas e só emite as novas. Casa cada nome novo, pela ordem, com o início mais antigo ainda não usado do `onsetDetector`. Reinicia sozinho no `onend`. | `onsetDetector`, `syllables` |
| `src/recognition/selectRecognizer.ts` | Escolhe o motor (Seção 6). | adaptadores |
| `src/engine/timeline.ts` | **Função pura.** `(notas, bpm, segmentos) → janelas [início, fim)` por nota. Pausa e retomada abrem um novo segmento a partir da nota atual. | — |
| `src/engine/scorer.ts` | **Função pura.** `(janelas, sílabas) → resultado por nota` (Seção 5). | `timeline` |
| `src/engine/usePlayer.ts` | **Reescrito.** Contagem de entrada e avanço visual guiados pelo relógio único via `requestAnimationFrame`. | `timeline` |
| `src/engine/usePracticeSession.ts` | Orquestra player, reconhecedor e scorer. Expõe o estado de exibição para `Practice.tsx`. | todos acima |
| `src/routes/Diagnostico.tsx` | Página `/diagnostico` para o spike (Seção 7). | `voskRecognizer` |

`src/engine/useSpeechNotes.ts` e `src/engine/noteMatcher.ts` são removidos.
`src/routes/Practice.tsx` passa a só renderizar o estado de `usePracticeSession`. Saem de lá
a janela de graça, `prevIndexRef`, `advanceTimeRef` e o ajuste fixo de `+2700 ms`.

O relógio é injetável (`Clock { now(): number }`) para que `usePlayer` e
`usePracticeSession` possam ser testados com um relógio falso.

## 5. Fluxo de dados e regras

### 5.1 Sessão

1. O aluno toca em Iniciar. Dentro desse gesto, o `AudioContext` é criado e retomado, o
   microfone abre e o reconhecedor começa a carregar ou aquecer.
2. **Contagem de entrada de um compasso: 4 tempos no BPM escolhido**, com o indicador visual
   de pulso. O instante de início da primeira nota é `t0`.
3. `timeline` calcula as janelas a partir de `t0`. O player mostra a nota cuja janela contém
   `clock.now()`.
4. Cada evento `syllable` vai para o `scorer`, que o atribui pela `onset`.
5. Se a nota atribuída é a que está na tela, o app mostra verde ou vermelho. Se ela já passou,
   o resultado é registrado sem feedback visual.
6. Depois da última nota, o app espera **1,5 s** para recolher resultados atrasados e então
   salva a sessão e navega para `/resultado`.

### 5.2 Regra de pontuação

- **Tolerância de antecipação:** `L = min(0,150 s, 0,25 × duração de um tempo)`. A janela de
  atribuição da nota `i` é `[início_i − L, fim_i − L)`. Todas as janelas se deslocam juntas,
  sem lacunas nem sobreposição.
- **A primeira sílaba na janela decide.** As seguintes na mesma janela são ignoradas.
- **Resultados por nota:** `'correct' | 'wrong' | 'missed'` com voz ligada; `null` no modo
  silencioso. O tipo `NoteResult.correct` vira `NoteResult.outcome` com esses valores, e a
  tela `Results.tsx` passa a mostrar "sem resposta" separado de "errado".
- **Sílabas fora de qualquer janela** (antes da primeira nota menos `L`, durante a pausa,
  depois da última) são descartadas.
- **Acidentes:** compara só o nome (`step`). "Fá" vale para Fá#. Limitação conhecida; o
  repertório atual só tem notas naturais.

### 5.3 Controles

- **Pausar** fecha o segmento atual da linha do tempo. **Retomar** faz nova contagem de 4
  tempos e abre um segmento a partir da nota atual, que recomeça do zero.
- **BPM travado durante a execução.** O `SpeedControl` fica desabilitado enquanto toca.
- **Visibilidade:** `visibilitychange` para `hidden` pausa automaticamente.

## 6. Erros e plano B

**Escolha do motor**, ao tocar em Iniciar:

1. Vosk, se o modelo estiver em cache ou terminar de carregar antes do fim da contagem.
2. Plano B, se o Vosk falhar, não carregar a tempo ou `navigator.deviceMemory` for menor que
   2 (quando disponível).
3. Modo silencioso, se nenhum reconhecedor funcionar, com aviso na tela.

O motor em uso aparece discretamente na prática ("voz: local" / "voz: online").

**Modelo:** servido de `public/models/` no próprio domínio e guardado pela Cache API. O
download começa quando o aluno liga o modo de voz em Configurações, com barra de progresso.
Se a lição começar com o download incompleto, ela usa o plano B.

| Situação | Comportamento |
|---|---|
| Microfone negado | Mensagem explicando como liberar; lição segue no modo silencioso. |
| Web Speech encerra sozinho | Reinicia; notas no intervalo ficam como `missed`. |
| Tela bloqueada ou troca de aba | Pausa automática. |
| Worker do Vosk trava | A lição em curso segue no modo silencioso; as próximas usam o plano B; aviso no console. |

## 7. Spike de viabilidade (primeira tarefa)

Antes da reescrita, a página `/diagnostico` roda o Vosk isolado e mostra:

- tempo de carga do modelo;
- memória usada (`performance.memory`, quando disponível);
- latência entre `onset` e a chegada do evento (média e p90);
- taxa de acerto numa sequência guiada das 7 sílabas a 60 e a 90 BPM.

**Critério de aprovação:** latência p90 < 500 ms, acerto ≥ 90%, nenhum travamento em iPhone.

O teste em aparelho físico é feito pelo Victor, num deploy de preview da Vercel, em um
iPhone e um Android. Se o iPhone reprovar, o plano B vira o padrão no iOS e o restante do
design não muda. Se ambos reprovarem, o plano B vira o padrão geral.

## 8. Testes

Adicionar Vitest e o script `npm test`.

**Unitários (funções puras):**

- `timeline`: durações misturadas, BPMs diferentes, pausa/retomada.
- `scorer`, em tabela:
  - sílaba no meio da janela → `correct`;
  - sílaba 100 ms antes da batida → atribuída à nota que começa;
  - evento que chega 1,5 s depois com `onset` dentro da janela → atribuído à nota certa
    (regressão do bug atual);
  - "ré mi sol" na mesma janela → só "ré" conta;
  - janela vazia → `missed`;
  - sílaba durante a pausa → descartada.
- `syllables`: todos os sinônimos aceitos; "o", "e", "sola" e afins rejeitados.

**Adaptadores, com falsos da API do navegador:**

- `webSpeechRecognizer`: eventos "dó" (parcial), "dó ré" (parcial), "dó ré" (final) geram
  exatamente duas sílabas (regressão do "encavalar").
- `onsetDetector`: sinal sintético silêncio → fala → silêncio gera um `onset` no instante
  esperado, com tolerância de 20 ms.
- `selectRecognizer`: falha do Vosk aciona o plano B; falha dos dois aciona o silencioso.

**Integração:** `usePracticeSession` com relógio falso e `FakeRecognizer`, rodando uma lição
completa até o resultado.

**Manual:** `/diagnostico` em aparelhos reais, com os critérios da Seção 7. O Vosk real não
entra em teste automatizado.

## 9. Fora de escopo

- Módulo de teoria musical da CCB (subprojeto 2).
- Precisão rítmica (adiantou/atrasou).
- Clique de metrônomo audível.
- Modo "espera" (avançar só quando o aluno acerta).
- Detecção de altura (solfejo cantado).
- Acidentes falados ("fá sustenido").
- CI no GitHub Actions.
