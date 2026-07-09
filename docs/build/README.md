# Pipeline de Build do HTML

Como o `.tex` vira o `html/index.html` publicado em
https://bjcp-brasil.github.io/cider-guidelines-2025-pt-br/.

## Visão geral

Todo push em `main` dispara `.github/workflows/update-doc.yml`:

1. `pandoc` gera `html/header.html` a partir de `frontpage.tex`.
2. Esse header é envolvido em `<header>...</header>` (pandoc não faz isso
   sozinho).
3. `pandoc` roda de novo, desta vez com todos os arquivos `.tex` do guia,
   gerando `html/index.html`. Customizações do `<head>`, layout toggle,
   CSS e footer entram nativamente via flags do pandoc (ver abaixo) — não
   por post-processing.
4. Um punhado de `sed` corrige artefatos específicos que o pandoc não tem
   flag nativa para resolver (ver "Fix HTML" abaixo).
5. `actions/upload-pages-artifact` + `actions/deploy-pages` publicam
   `html/` no GitHub Pages.

`validate-syntax.yml` roda o mesmo pipeline (passos 1–4) em pushes para
branches que não são `main`, só pra validar que o LaTeX/pandoc não quebra
— sem publicar nada.

**Importante**: os dois workflows devem ficar em sincronia. Se você mudar
os args do pandoc ou o bloco de `sed` num, replique no outro (e no
`scripts/preview-local.sh`, ver abaixo).

## De onde vem cada coisa no `<head>`/`<body>`

| O que | Como | Arquivo fonte |
|---|---|---|
| `lang`, `<title>` | `--metadata-file` | `assets/pandoc-metadata.yaml` |
| meta description, canonical, OG, Twitter Card, favicon, JSON-LD | `-H` (include-in-header) | `assets/head-extra.html` |
| checkbox do toggle de layout | `-B` (include-before-body, 1º) | `assets/layout-toggle.html` |
| header do guia (título, versão) | `-B` (include-before-body, 2º) | `html/updated-header.html` (gerado no passo 1–2) |
| footer | `-A` (include-after-body, 1º) | `assets/footer.html` |
| script do toggle (lê/escreve `?view=sidebar` na URL) | `-A` (include-after-body, 2º) | `assets/layout-toggle-script.html` |
| CSS clássico | `-c` | `assets/style.css` |
| CSS do menu lateral | `-c` | `assets/sidebar-toggle.css` |

`-B`/`-A`/`-c` podem repetir — a ordem dos flags na linha de comando é a
ordem em que o conteúdo aparece no HTML final.

## O que o "Fix HTML" (sed) ainda faz

Só o que pandoc genuinamente não tem flag nativa para resolver — são
artefatos específicos de como o pandoc converte certas estruturas LaTeX
pra HTML5:

- Remove um `<p><span>2</span></p>` espúrio (numeração de página do LaTeX
  vazando pro HTML).
- Converte `<span><strong>...</strong></span><br />` do título em
  `<h1>`/`<h2>`/`<h3>` de verdade (pandoc não interpreta esses spans como
  headings).
- Remove o `<span id="fig:bjcp-logo" ...>` (referência de figura do LaTeX
  sem equivalente em HTML).
- Corrige o `alt` da imagem do logo (pandoc gera `alt="image"` genérico
  a partir do `\includegraphics`).

Se um desses sed parar de casar (silenciosamente!), o sintoma no HTML
publicado costuma ser: título sem tag de heading, ou span/id residual
visível. Não há teste automatizado pra isso hoje — checagem visual depois
do deploy é a rede de segurança atual.

## Testando localmente antes do push

```
scripts/preview-local.sh
```

Roda o pipeline exato do CI via Docker (`pandoc/core:2.9` — a mesma
versão pinada no workflow, que **diverge** do pandoc que você tenha
instalado localmente via Homebrew/apt). Requer Docker e GNU sed
(`brew install gnu-sed` no macOS — o sed nativo do BSD não interpreta
`\n` em substituições e falha com erro de "undefined label").

Abre `html/index.html` automaticamente ao final.

## Gotchas conhecidos

- **BSD sed vs GNU sed**: macOS nativo não é GNU sed. CI (Ubuntu) é. Use
  `gsed` local ou rode via `scripts/preview-local.sh` (que já detecta
  isso).
- **pandoc 2.9 (CI) vs pandoc local**: podem gerar HTML sutilmente
  diferente (avisos, espaçamento). Não confie em `pandoc` local pra
  validar o que vai pra produção — use o script acima, que usa a mesma
  imagem Docker do CI.
- **`assets/head-extra.html` tem `"version": "1.0"` hardcoded** no JSON-LD
  — não é lido do `frontpage.tex` automaticamente. Ao fazer bump de
  versão, atualize os dois lugares.
