# 🎼 Leitura Musical

App web para alunos de música treinarem **leitura de notas à primeira vista**. As notas
passam automaticamente num ritmo controlado e o aluno identifica cada uma — falando o
nome (reconhecimento de voz) ou conferindo os nomes ao final da lição.

## Funcionalidades

- **Passador automático de notas** guiado pelo relógio de áudio, com contagem de entrada
  4-3-2-1 e controle de velocidade (30–120 BPM).
- **Identificação por voz** (pt-BR): fale "dó, ré, mi…" e receba feedback na hora
  (verde/vermelho). Cada sílaba é atribuída à nota pelo **instante em que começou a ser
  falada** (detector de início de fala), não pelo momento em que o texto chega.
  - **Motor local (Vosk)**: roda no navegador, offline, com gramática restrita às notas.
    O modelo (≈ 30 MB) é baixado uma vez em Configurações.
  - **Plano B (Web Speech API)**: usado quando o modelo não está baixado, o aparelho tem
    pouca memória, o Vosk não carrega a tempo ou caiu numa lição anterior.
  - Sem nenhum motor disponível, a lição segue no modo sem voz.
- **Modo sem voz**: os nomes das notas aparecem só na tela de resultados.
- **Diagnóstico** (`/diagnostico`): mede latência, acerto e memória de cada motor.
- **Repertório**: escala de Dó maior, notas aleatórias por nível (1–4) e melodias de
  domínio público (Brilha Brilha Estrelinha, Lightly Row, Go Tell Aunt Rhody).
- **Dois modos de exibição**: flashcard (uma nota grande por vez) ou partitura completa.
- **Acessibilidade**: tamanho de fonte (A / A+ / A++) e alto contraste, sempre no topo;
  foco visível na navegação por teclado.

## Stack

React + TypeScript + Vite · Tailwind CSS · VexFlow (notação) · Zustand · React Router ·
vosk-browser (reconhecimento local) · lucide-react (ícones) · Vitest + Testing Library.
Tipografia Plus Jakarta Sans. Sem backend: tudo client-side, configurações salvas no
`localStorage`.

## Rodando

```bash
npm install
npm run dev       # baixa o modelo de voz se faltar e sobe o Vite
npm test          # testes (Vitest)
npm run lint      # ESLint
npm run build     # build de produção (também baixa o modelo se faltar)
npm run icons     # regera os ícones PNG do app a partir do SVG
```

O `scripts/fetch-model.mjs` roda sozinho no `predev` e no `prebuild`: baixa o modelo Vosk
pt-BR e o reempacota em `public/models/vosk-pt-small.tar.gz` (só na primeira vez).

> ⚠️ O motor local precisa de AudioWorklet (navegadores atuais). O plano B (Web Speech)
> funciona melhor no **Chrome/Edge**. Sem suporte, o app avisa e a lição segue sem voz.

## Estrutura

- `src/data/` — modelo de notas, solfejo e repertório
- `src/engine/` — linha do tempo, relógio, pontuação por onset, player
  (`useTimelinePlayer`) e sessão de prática (`usePracticeSession`)
- `src/recognition/` — reconhecedores Vosk e Web Speech, escolha do motor
  (`selectRecognizer`), modelo aquecido (`voskModelCache`), download/cache do modelo
  (`modelStore`), detector de início de fala e alinhador
- `src/audio/` — microfone com AudioWorklet (`public/worklets/mic-tap.js`)
- `src/components/` — pauta (VexFlow), controles, feedback, acessibilidade e componentes
  base em `ui/` (Button, Card, Badge, IconBox)
- `src/theme/` — leitura de tokens e teste de contraste
- `src/index.css` — tokens de cor da identidade visual (incluindo alto contraste)
- `src/routes/` — Início, Prática, Resultado, Configurações e Diagnóstico
- `src/store/` — estado/configurações (Zustand + persist)
- `scripts/` — download do modelo e geração de ícones
