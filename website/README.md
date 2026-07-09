# Piloto: Docusaurus como versão web do guia

Branch de experimento avaliando [Docusaurus](https://docusaurus.io/) como
substituto do pipeline atual (`pandoc` + `sed` manual, ver
[`../docs/build/README.md`](../docs/build/README.md)) pra gerar a versão web
publicada em GitHub Pages.

## Premissa

O `.tex` na raiz do repositório continua sendo **a única fonte da verdade**
(é dele que o PDF é gerado). Nada aqui edita ou substitui os `.tex`.
`website/docs/` é **gerado, não versionado** (está no `.gitignore`) —
recriado do zero a cada build, local ou no CI, por
[`scripts/generate-docs.mjs`](scripts/generate-docs.mjs).

## Como funciona

1. `scripts/generate-docs.mjs` roda `pandoc -f latex -t gfm` (via Docker,
   mesma imagem `pandoc/core:2.9` já usada no pipeline HTML atual) em cada
   `.tex` de conteúdo, na ordem definida no `MANIFEST` do próprio script —
   que espelha os `\input` de `../main.tex`.
2. Pra cada categoria (`c1-traditional-cider`, etc.) gera uma pasta em
   `docs/` com `_category_.json` (label + ordem, extraídos do
   `\section*{...}` de `header.tex`) e um `index.md`.
3. Pra cada estilo/subseção, gera um `.md` com frontmatter `title` extraído
   do `\subsection*{...}` correspondente.
4. `docusaurus build` consome `docs/` normalmente — sidebar é
   **autogerada** a partir da estrutura de pastas/arquivos, então não
   existe mais lista de arquivos duplicada em 3 lugares como no pipeline
   pandoc atual.

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

`.github/workflows/docusaurus-pilot.yml` roda `generate-docs.mjs` +
`npm run build` a cada push nesta branch e sobe o resultado como
**artifact** (`docusaurus-build`, 14 dias de retenção) — **não faz deploy**
pro GitHub Pages. O Pages do repositório continua servindo o resultado de
`update-doc.yml` a partir da `main`, sem interferência deste piloto.

## Se decidirem adotar

Checklist pra promover isso a deploy de verdade (ainda não feito, de
propósito):

- [ ] Trocar o trigger do workflow de `branches: ["pilot/docusaurus"]` pra
      `branches: ["main"]`.
- [ ] Adicionar `pages: write` / `id-token: write` em `permissions`, os
      steps `actions/configure-pages`, trocar
      `actions/upload-artifact` por `actions/upload-pages-artifact` e
      adicionar `actions/deploy-pages` (mesmo padrão de
      `../.github/workflows/update-doc.yml`).
- [ ] Aposentar `update-doc.yml` e `validate-syntax.yml` (ou manter
      `validate-syntax.yml` adaptado pra rodar só o build, sem deploy, em
      branches que não são `main` — hoje o Docusaurus já falha o build se
      algum link interno quebrar, o que cobre boa parte do que
      `validate-syntax.yml` valida hoje).
- [ ] Decidir se mantém `assets/style.css`/`sidebar-toggle.css` do
      pipeline antigo ou se o tema padrão do Docusaurus (customizável via
      `src/css/custom.css`) substitui.
- [ ] Conferir orçamento de tamanho do artifact/build (Docusaurus embala
      React + assets; o HTML do pandoc é bem mais leve).
