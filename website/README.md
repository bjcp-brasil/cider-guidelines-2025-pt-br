# Versão web do guia (Docusaurus)

Gera a versão web publicada em GitHub Pages a partir dos mesmos `.tex` do
PDF, usando [Docusaurus](https://docusaurus.io/). Substituiu o pipeline
anterior baseado em `pandoc` + `sed` manual.

## Premissa

O `.tex` na raiz do repositório continua sendo **a única fonte da verdade**
(é dele que o PDF é gerado). Nada aqui edita ou substitui os `.tex`.
`website/docs/` é **gerado, não versionado** (está no `.gitignore`) —
recriado do zero a cada build, local ou no CI, por
[`scripts/generate-docs.mjs`](scripts/generate-docs.mjs).

## Como funciona

1. `scripts/generate-docs.mjs` roda `pandoc -f latex -t gfm` (via Docker,
   imagem `pandoc/core:2.9`) em cada `.tex` de conteúdo, na ordem definida
   no `MANIFEST` do próprio script — que espelha os `\input` de
   `../main.tex`. `frontpage.tex` (capa: título, logo, créditos, versão)
   é tratado à parte, vira `capa.md` na raiz do site (`/`).
2. Pra cada categoria (`c1-traditional-cider`, etc.) gera uma pasta em
   `docs/` com `_category_.json` (label + ordem, extraídos do
   `\section*{...}` de `header.tex`) e um `index.md`.
3. Pra cada estilo/subseção, gera um `.md` com frontmatter `title` extraído
   do `\subsection*{...}` correspondente.
4. `docusaurus build` consome `docs/` normalmente — sidebar é
   **autogerada** a partir da estrutura de pastas/arquivos, sem lista de
   arquivos duplicada como no pipeline pandoc antigo.

Busca é local (`@easyops-cn/docusaurus-search-local`, indexada no build),
sem depender de conta/API externa.

## Rodando localmente

Requer Docker (pro passo do pandoc) e Node 20+.

```bash
node scripts/generate-docs.mjs   # gera website/docs/ a partir dos .tex
npm install
npm run start                    # dev server com hot reload
# ou
npm run build && npm run serve   # build de produção + preview local
```

## CI

- `.github/workflows/deploy-pages.yml`: a cada push em `main`, gera os
  `.md`, builda e publica em GitHub Pages.
- `.github/workflows/build-check.yml`: mesma coisa em qualquer outra
  branch, só que sem publicar — só pra pegar build quebrado antes do
  merge.
