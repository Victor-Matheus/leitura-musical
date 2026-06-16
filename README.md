# 🎼 Leitura Musical

App web para alunos de música treinarem **leitura de notas à primeira vista**. As notas
passam automaticamente num ritmo controlado e o aluno identifica cada uma — falando o
nome (reconhecimento de voz) ou conferindo os nomes ao final da lição.

## Funcionalidades

- **Passador automático de notas** com controle de velocidade (30–120 BPM).
- **Identificação por voz** (Web Speech API, pt-BR): fale "dó, ré, mi…" e receba
  feedback na hora (verde/vermelho). Pode ser desligada — aí os nomes das notas aparecem
  só na tela de resultados.
- **Repertório**: escala de Dó maior, notas aleatórias por nível (1–4) e melodias de
  domínio público (Brilha Brilha Estrelinha, Lightly Row, Go Tell Aunt Rhody).
- **Dois modos de exibição**: flashcard (uma nota grande por vez) ou partitura completa.
- **Acessibilidade**: tamanho de fonte (A / A+ / A++) e alto contraste, sempre no topo.

## Stack

React + TypeScript + Vite · Tailwind CSS · VexFlow (notação) · Zustand · React Router.
Sem backend: tudo client-side, configurações salvas no `localStorage`.

## Rodando

```bash
npm install
npm run dev       # abra no Chrome para o melhor suporte a voz
npm run build     # build de produção
```

> ⚠️ O reconhecimento de voz funciona melhor no **Chrome/Edge**. Em navegadores sem
> suporte, o app avisa e o modo sem voz continua funcionando normalmente.

## Estrutura

- `src/data/` — modelo de notas, solfejo e repertório
- `src/engine/` — motor do passador (`usePlayer`), voz (`useSpeechNotes`, `noteMatcher`)
- `src/components/` — pauta (VexFlow), controles, feedback, acessibilidade
- `src/routes/` — Home, Prática, Resultado, Configurações
- `src/store/` — estado/configurações (Zustand + persist)
