# Redesign visual — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar a identidade visual "bento" verde-escuro a todas as telas e trocar o ícone do app.

**Architecture:** Tokens em variáveis CSS (`src/index.css`) com dois temas (claro e alto contraste); componentes base em `src/components/ui/` consumindo só tokens; telas reescritas visualmente sem mudar fluxo.

**Tech Stack:** React 19, Tailwind CSS 4, lucide-react, Plus Jakarta Sans (Google Fonts), @resvg/resvg-js (só para gerar PNGs).

**Spec:** `docs/superpowers/specs/2026-10-09-redesign-visual-design.md`

**Pré-requisito:** o plano do motor (`2026-10-09-motor-reconhecimento.md`) já executado no mesmo branch.

## Global Constraints

- Nenhuma cor fixa em componentes: sempre `var(--token)`. Exceção: o SVG do ícone.
- Nenhum texto, nome ou marca "Pluma"/"Vela". O app é "Leitura Musical".
- Ícones: `lucide-react`, `strokeWidth={1.75}`, `size` 22–24.
- Layout sem rolagem horizontal em 375 px; gutter lateral de 16 px no celular.
- A escala de fonte (`--font-scale`) e o alto contraste (`.theme-contrast`) continuam funcionando.
- Não mudar lógica nem fluxo das telas; só apresentação.
- Commits sem `Co-Authored-By`; `git add` só com os arquivos da tarefa.
- `npm test`, `npm run lint`, `npm run build` passando ao fim de cada tarefa.

## Review Focus

1. **Escala de fonte A++ no celular:** títulos e cards não podem estourar a largura. Verificação visual na Task 6 com `font-enorme` em 375 px.
2. **Alto contraste:** a pauta (VexFlow) precisa de clave e notas brancas sobre `--surface`. Verificação visual na Task 6.
3. **Destaque da nota na pauta** usa cores lidas dos tokens em tempo de execução; trocar de tema durante a prática deve atualizar. Teste em Task 4 (`readToken`).
4. **Ícone em fundo claro e escuro** (aba do navegador, tela inicial do iOS): verificação visual na Task 3.
5. **Fonte não carregada (offline):** o fallback Inter/sans-serif mantém o layout. Coberto pela pilha de fallback na Task 1.

## Ondas de execução

| Onda | Tarefas |
|---|---|
| 1 | Task 1 |
| 2 | Task 2, Task 3 (paralelas) |
| 3 | Task 4, Task 5 (paralelas) |
| 4 | Task 6 |

---

### Task 1: Tokens, fonte e teste de contraste

**Files:**
- Modify: `src/index.css`, `index.html`, `package.json`
- Create: `src/theme/contrast.ts`, `src/theme/contrast.test.ts`
- Delete: `src/App.css` (não é importado), `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png` se não houver referência (`grep -r` antes)

**Interfaces:**
- Produces:
  ```ts
  // src/theme/contrast.ts
  export function contrastRatio(hexA: string, hexB: string): number   // WCAG 2.x
  export function parseThemeBlocks(css: string): { light: Record<string, string>; contrast: Record<string, string> }
  // light = variáveis de ':root', contrast = de '.theme-contrast'; chaves sem '--'
  ```
  Tokens CSS: exatamente os da Seção 3 do spec.

- [ ] **Step 1:** `npm i lucide-react` e `npm i -D @resvg/resvg-js`.
- [ ] **Step 2: Teste que falha** `contrast.test.ts`:
  ```ts
  test('contrastRatio', () => { expect(contrastRatio('#000000','#FFFFFF')).toBeCloseTo(21, 0) })
  const css = readFileSync('src/index.css', 'utf8'); const { light, contrast } = parseThemeBlocks(css)
  test.each([
    ['light', 'text', 'bg', 4.5], ['light', 'text', 'surface', 4.5], ['light', 'muted', 'bg', 4.5], ['light', 'muted', 'surface', 4.5],
    ['light', 'on-primary', 'primary', 4.5], ['contrast', 'text', 'bg', 4.5], ['contrast', 'muted', 'surface', 4.5],
    ['contrast', 'on-primary', 'primary', 4.5], ['contrast', 'border', 'surface', 3],
  ])('%s: %s sobre %s ≥ %d', (theme, fg, bg, min) => {
    const t = theme === 'light' ? light : { ...light, ...contrast }
    expect(contrastRatio(t[fg], t[bg])).toBeGreaterThanOrEqual(min) })
  test('branco sobre success e error no tema claro', () => {
    expect(contrastRatio('#FFFFFF', light.success)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio('#FFFFFF', light.error)).toBeGreaterThanOrEqual(4.5) })
  ```
- [ ] **Step 3:** `npx vitest run src/theme` → FAIL.
- [ ] **Step 4:** Implementar `contrast.ts`; reescrever os blocos `:root` e `.theme-contrast` de `index.css` com os tokens do spec (valores só em hex nos tokens de cor; sombras à parte); `body` com `font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif`. Em `index.html`: `preconnect` + link do Google Fonts `Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap`. Se algum par falhar, ajuste o tom do token no tema que falhou (mantendo o matiz) e registre no commit.
- [ ] **Step 5:** Testes passam; build passa.
- [ ] **Step 6:** Commit `style: tokens da nova identidade visual e teste de contraste`.

---

### Task 2: Componentes base

**Files:**
- Create: `src/components/ui/Button.tsx`, `Card.tsx`, `Badge.tsx`, `IconBox.tsx`, `index.ts`, `ui.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  export function Button(props: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'cta' | 'ghost'; icon?: LucideIcon; size?: 'md' | 'lg' }): JSX.Element
  export function Card(props: HTMLAttributes<HTMLDivElement> & { variant?: 'light' | 'dark'; interactive?: boolean; as?: 'div' | 'section' | 'button' }): JSX.Element
  export function Badge(props: { children: ReactNode; tone?: 'status' | 'neutral' }): JSX.Element
  export function IconBox(props: { icon: LucideIcon; tone?: 'soft' | 'dark' }): JSX.Element
  ```
- Classes conforme design.json, com cores trocadas por tokens: ex. `primary` = `bg-[var(--primary)] hover:bg-[var(--primary-strong)] text-[var(--on-primary)] font-semibold px-6 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]`; `Card light` = `bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-6 lg:p-8 shadow-[var(--shadow-card)]` (+ `hover:border-[var(--border)] hover:shadow-[var(--shadow-hover)]` se `interactive`); `Card dark` = `bg-[var(--surface-dark-2)] border border-white/10 text-white`.
- Botões com `disabled` têm `opacity-50 cursor-not-allowed` e sem hover.

- [ ] **Step 1: Teste que falha** `ui.test.tsx`: `Button variant="cta"` tem classe `rounded-full`; `Button` com `icon={Play}` renderiza um `svg` com `stroke-width="1.75"`; `Button disabled` tem `disabled` e `opacity-50`; `Card variant="dark"` tem a classe com `--surface-dark-2`; `Card as="button" interactive` renderiza `<button>`; `Badge` renderiza o texto.
- [ ] **Step 2:** FAIL. **Step 3:** Implementar. **Step 4:** Passa.
- [ ] **Step 5:** Commit `feat(ui): componentes base Button, Card, Badge e IconBox`.

---

### Task 3: Ícone do app, manifesto e splash

**Files:**
- Create: `scripts/build-icons.mjs`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`, `public/manifest.webmanifest`, `src/components/AppIcon.tsx`
- Modify: `public/favicon.svg`, `index.html`, `src/components/SplashScreen.tsx`, `package.json` (script `"icons": "node scripts/build-icons.mjs"`)

**Interfaces:**
- Produces: `AppIcon({ size: number })` — o mesmo desenho do `favicon.svg` como componente React (SVG inline), usado no cabeçalho e no splash.

- [ ] **Step 1:** Desenhar `favicon.svg` (viewBox 0 0 512 512): `rect` rx 112 fill `#1C3F3A`; clave de sol branca estilizada (um `path` com traço `#FFFFFF`, `stroke-width` ~28, `stroke-linecap="round"`, sem preenchimento, ocupando ~60% da altura, centralizada); um ponto ou meia-lua em `#34D399` na base da clave. O desenho deve ser reconhecível como clave de sol a 32 px.
- [ ] **Step 2:** `scripts/build-icons.mjs` renderiza o SVG com `@resvg/resvg-js` em 180, 192 e 512 px. Rodar `npm run icons`; os três PNGs existem com as dimensões certas (`file public/*.png`).
- [ ] **Step 3:** Verificação visual: abrir `favicon.svg` e `icon-192.png` no painel do navegador, capturar tela e confirmar que a clave é legível; ajustar o path até ficar.
- [ ] **Step 4:** `manifest.webmanifest` conforme spec Seção 6; `index.html` com `<link rel="manifest">`, `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`, `<meta name="theme-color" content="#1C3F3A">`.
- [ ] **Step 5:** `AppIcon.tsx` e `SplashScreen.tsx` (fundo `var(--surface-dark)`, `AppIcon size={96}`, "Leitura Musical" branco em 800). Manter as animações existentes.
- [ ] **Step 6:** `npm run build` passa. Commit `feat: novo ícone do app, manifesto e splash`.

---

### Task 4: Cabeçalho, Início e Prática

**Files:**
- Modify: `src/App.tsx`, `src/components/AccessibilityBar.tsx`, `src/routes/Home.tsx`, `src/routes/Practice.tsx`, `src/components/NoteStaff.tsx`, `src/components/TransportControls.tsx`, `src/components/SpeedControl.tsx`, `src/components/VoiceFeedback.tsx`, `src/components/BeatPulse.tsx`
- Create: `src/theme/readToken.ts`, `src/theme/readToken.test.ts`

**Interfaces:**
- Consumes: `Button`, `Card`, `Badge`, `IconBox` (Task 2), `AppIcon` (Task 3).
- Produces: `readToken(name: string): string` — `getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim()`. `NoteStaff` recebe as cores via `readToken` e re-renderiza quando `highContrast` muda (a prop `textColor` atual pode ser substituída por isso).

- [ ] **Step 1: Teste que falha** `readToken.test.ts`: definir `--primary: #1C3F3A` no `documentElement.style` e esperar `readToken('primary') === '#1C3F3A'`.
- [ ] **Step 2:** FAIL. **Step 3:** Implementar `readToken`. Reescrever as telas conforme spec Seção 5 (cabeçalho, Início, Prática), usando os componentes `ui/`. `Practice.tsx`: `FEEDBACK_COLOR` passa a ler `primary`, `success`, `error` via `readToken`. Ícones Lucide: `Settings`, `Music`, `Shuffle`, `Play`, `Pause`, `RotateCcw`, `ArrowLeft`, `Mic`, `MicOff`.
- [ ] **Step 4:** Testes, lint e build passam.
- [ ] **Step 5:** Verificação no painel do navegador: Início e Prática em 375 px e desktop. Sem rolagem horizontal; contagem e pulso visíveis.
- [ ] **Step 6:** Commit `style: nova identidade no cabeçalho, Início e Prática`.

---

### Task 5: Resultado, Configurações e Diagnóstico

**Files:**
- Modify: `src/routes/Results.tsx`, `src/routes/Settings.tsx`, `src/components/ModelDownload.tsx`, `src/routes/Diagnostico.tsx`

**Interfaces:**
- Consumes: `Button`, `Card`, `Badge`, `IconBox` (Task 2).

- [ ] **Step 1:** Reescrever conforme spec Seção 5 (Resultado, Configurações, Diagnóstico). O `Toggle` de Configurações usa `--primary` ligado e `--border` desligado, e `role="switch"` continua. Ícones: `Mic`, `Eye`, `LayoutGrid`, `Gauge`, `Download`, `CheckCircle2`, `Trophy`.
- [ ] **Step 2:** `Results.test.tsx` (do plano do motor) continua passando; testes, lint e build passam.
- [ ] **Step 3:** Verificação no painel: Resultado (após uma lição sem voz), Configurações e `/diagnostico` em 375 px e desktop.
- [ ] **Step 4:** Commit `style: nova identidade em Resultado, Configurações e Diagnóstico`.

---

### Task 6: Verificação visual completa

- [ ] **Step 1:** No painel do navegador, para cada tela (Início, Prática durante a contagem e tocando, Resultado, Configurações, Diagnóstico, splash): captura em 375×812 e em desktop, no tema claro e no alto contraste, e Início/Prática com fonte A++ em 375 px.
- [ ] **Step 2:** Conferir: sem rolagem horizontal (`document.documentElement.scrollWidth <= innerWidth` via `javascript_tool`), pauta legível no alto contraste, nenhum erro no console, fonte Plus Jakarta Sans aplicada (`getComputedStyle(document.body).fontFamily`).
- [ ] **Step 3:** Corrigir o que falhar, com commit `fix(style): …` por correção.
- [ ] **Step 4:** Atualizar a seção Stack do README (lucide-react, Plus Jakarta Sans, `npm run icons`). Commit `docs: README do redesign`.
