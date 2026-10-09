# Redesign visual — Design

**Data:** 2026-10-09
**Status:** decisões tomadas com o Victor em conversa; execução autônoma autorizada
**Fonte:** `design.json` "Pluma Minimalist Bento System" enviado na conversa (só a seção `design_system`)

## 1. Objetivo

Aplicar a identidade visual do design.json (paleta verde-escuro e off-white, Plus Jakarta
Sans, cards bento, ícones Lucide) a todas as telas do Leitura Musical, e trocar o ícone do
app. O app continua se chamando Leitura Musical; nenhum texto, seção ou marca do "Pluma" é
usado. A `page_structure` do design.json (conteúdo de fintech) fica fora.

## 2. Decisões

| Tema | Decisão |
|---|---|
| Escopo | Fundamentos e componentes do design.json aplicados às telas existentes: Início, Prática, Resultado, Configurações, Diagnóstico, cabeçalho, splash. |
| Ícone | Quadrado arredondado `#1C3F3A`, clave de sol branca estilizada, detalhe em menta `#34D399`. Usado em favicon, ícone de tela inicial (iOS/Android) e splash. |
| Alto contraste | Mantido e adaptado à paleta escura do design.json. |
| Fonte | Plus Jakarta Sans (Google Fonts, pesos 400–800), com fallback Inter e sans-serif. A escala de fonte atual (A / A+ / A++) é mantida. |
| Ícones | `lucide-react`, `strokeWidth={1.75}`, tamanho 22–24 px, caixa `bg #E6F4EA` com traço `#1C3F3A`. |

## 3. Tokens

Fonte da verdade: variáveis CSS em `src/index.css`. Os nomes atuais são mantidos para não
quebrar componentes; tokens novos entram ao lado.

| Token | Tema claro | Alto contraste |
|---|---|---|
| `--bg` | `#F8F9FA` | `#0F2421` |
| `--surface` | `#FFFFFF` | `#14302C` |
| `--surface-dark` | `#1C3F3A` | `#1C3F3A` |
| `--surface-dark-2` | `#14302C` | `#0B1C19` |
| `--text` | `#111827` | `#FFFFFF` |
| `--muted` | `#6B7280` | `#D1D5DB` |
| `--subtle` | `#9CA3AF` | `#B8C2BF` |
| `--primary` | `#1C3F3A` | `#34D399` |
| `--primary-strong` | `#142F2B` | `#6EE7B7` |
| `--on-primary` | `#FFFFFF` | `#0B1C19` |
| `--secondary` | `#EBE8D8` | `#1C3F3A` |
| `--on-secondary` | `#1C3F3A` | `#FFFFFF` |
| `--accent` | `#34D399` | `#34D399` |
| `--accent-soft` | `#E6F4EA` | `#1C3F3A` |
| `--badge-bg` | `#D1F0E7` | `#1C3F3A` |
| `--badge-text` | `#0D5C4D` | `#A7F3D0` |
| `--success` | `#047857` | `#4ADE80` |
| `--error` | `#DC2626` | `#FF8A8A` |
| `--border` | `#E5E7EB` | `#5F837D` |
| `--border-subtle` | `#EEF0F2` | `#335450` |
| `--shadow-card` | `0 2px 8px rgba(0,0,0,0.04)` | `none` |
| `--shadow-hover` | `0 10px 25px -5px rgba(0,0,0,0.08)` | `none` |

**Requisito de contraste (WCAG AA):** em cada tema, `--text`, `--muted` sobre `--bg` e
`--surface` ≥ 4,5:1; `--on-primary` sobre `--primary` ≥ 4,5:1; branco sobre `--success` e
`--error` ≥ 4,5:1 no tema claro; `--border` sobre `--surface` ≥ 3:1 no alto contraste.
Um teste automatizado lê `src/index.css` e verifica esses pares.

## 4. Componentes

Novos em `src/components/ui/`, com as classes do design.json:

- `Button` — variantes `primary`, `secondary`, `cta` (pílula), `ghost`; aceita `icon`.
- `Card` — variantes `light` (bento claro) e `dark` (bento escuro); `interactive` aplica hover.
- `Badge` — pílula de status (`--badge-bg` / `--badge-text`).
- `IconBox` — caixa arredondada com ícone Lucide.

Todos usam as variáveis CSS (não cores fixas), para o alto contraste funcionar sem
duplicação.

## 5. Telas

- **Cabeçalho:** ícone novo + "Leitura Musical" em Plus Jakarta Sans 800; barra de
  acessibilidade e engrenagem (Lucide `Settings`) em botões `secondary` compactos. Container
  `max-w-5xl mx-auto px-4 sm:px-6 lg:px-8`.
- **Início:** grade bento. Card escuro de destaque (título, subtítulo, CTA pílula "Começar
  pela escala"). Seção "Melodias" com cards claros (ícone `Music`, título, `Badge` de nível).
  Seção "Notas aleatórias" com 4 cards de nível (ícone `Shuffle`). 1 coluna no celular,
  2–3 no desktop.
- **Prática:** pauta num card claro grande; cabeçalho com título e `Badge` "3 / 16"; feedback
  e pulso abaixo; controles com `Button`. Cores de destaque da nota vêm de `--primary`,
  `--success`, `--error`.
- **Resultado:** card escuro com a porcentagem grande e "x de y notas certas"; lista de notas
  como pílulas (`--success`, `--error`, `--border-subtle` para sem resposta).
- **Configurações:** cada opção num card claro com `IconBox` (`Mic`, `Eye`, `LayoutGrid`,
  `Gauge`); toggles na cor `--primary`.
- **Diagnóstico:** cards claros, sem layout especial.
- **Splash:** fundo `--surface-dark`, ícone novo, nome em branco.

## 6. Ícone e manifesto

- `public/favicon.svg` — ícone vetorial.
- `public/apple-touch-icon.png` (180), `public/icon-192.png`, `public/icon-512.png` gerados
  do SVG por `scripts/build-icons.mjs` (`@resvg/resvg-js`) e commitados.
- `public/manifest.webmanifest` com `name`, `short_name`, `theme_color #1C3F3A`,
  `background_color #F8F9FA`, `display: standalone`.
- `index.html`: links do manifesto, `apple-touch-icon`, `theme-color`, Google Fonts.

## 7. Testes e verificação

- Teste de contraste dos tokens (Seção 3).
- Testes de renderização dos componentes `ui/` (variante → classe/estilo esperado).
- Testes existentes continuam passando.
- Verificação visual no painel do navegador: capturas de cada tela em 375 px e em desktop,
  nos dois temas, sem rolagem horizontal.

## 8. Fora de escopo

- Landing page no formato do design.json.
- Modo escuro automático pelo sistema (o alto contraste continua sendo opção manual).
- Mudanças de conteúdo ou de fluxo das telas.
