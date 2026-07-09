#!/usr/bin/env bash
# Reproduces the update-doc.yml pipeline locally (same pandoc/core:2.9 image
# used in CI) so you can preview html/index.html before pushing.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

if command -v gsed >/dev/null 2>&1; then
  SED=gsed
elif sed --version >/dev/null 2>&1; then
  # sed --version only succeeds on GNU sed; BSD sed errors out
  SED=sed
else
  echo "Precisa do GNU sed (o sed do macOS não entende \\n nas substituições)." >&2
  echo "Instale com: brew install gnu-sed" >&2
  exit 1
fi

rm -rf html
mkdir html
cp -r assets html

docker run --rm -v "$PWD":/data -w /data pandoc/core:2.9 \
  frontpage.tex -o html/header.html

echo "<header>$(cat html/header.html)</header>" > html/updated-header.html

docker run --rm -v "$PWD":/data -w /data pandoc/core:2.9 \
  --toc -s \
  --metadata-file assets/pandoc-metadata.yaml \
  -H assets/head-extra.html \
  -B assets/layout-toggle.html \
  -B html/updated-header.html \
  -A assets/footer.html \
  -A assets/layout-toggle-script.html \
  -c assets/style.css \
  -c assets/sidebar-toggle.css \
  introduction-to-cider-and-perry-styles/header.tex \
  introduction-to-the-2025-cider-guidelines/header.tex \
  introduction-to-the-2025-cider-guidelines/aroma-and-flavor.tex \
  introduction-to-the-2025-cider-guidelines/appearance.tex \
  introduction-to-the-2025-cider-guidelines/mouthfeel.tex \
  introduction-to-the-2025-cider-guidelines/ingredients.tex \
  introduction-to-the-2025-cider-guidelines/entry-instructions.tex \
  c1-traditional-cider/header.tex \
  c1-traditional-cider/c1-a-common-cider.tex \
  c1-traditional-cider/c1-b-heirloom-cider.tex \
  c1-traditional-cider/c1-c-english-cider.tex \
  c1-traditional-cider/c1-d-french-cider.tex \
  c1-traditional-cider/c1-e-spanish-cider.tex \
  c2-strong-cider/header.tex \
  c2-strong-cider/c2-a-new-england-cider.tex \
  c2-strong-cider/c2-b-applewine.tex \
  c2-strong-cider/c2-c-ice-cider.tex \
  c2-strong-cider/c2-d-fire-cider.tex \
  c3-specialty-cider/header.tex \
  c3-specialty-cider/c3-a-fruit-cider.tex \
  c3-specialty-cider/c3-b-spiced-cider.tex \
  c3-specialty-cider/c3-c-experimental-cider.tex \
  c4-perry/header.tex \
  c4-perry/c4-a-common-perry.tex \
  c4-perry/c4-b-heirloom-perry.tex \
  c4-perry/c4-c-ice-perry.tex \
  c4-perry/c4-d-experimental-perry.tex \
  -f latex -t html5 -o html/index.html

$SED -i 's:<p><span>2</span></p>::g' html/index.html
$SED -i 's:<span><strong>BEER JUDGE CERTIFICATION PROGRAM</strong></span><br />:<h1>BEER JUDGE CERTIFICATION PROGRAM</h1>:g' html/index.html
$SED -i 's:<span><strong>Guia de Estilos 2025</strong> </span><br />:<h2>Guia de Estilos 2025</h2>:g' html/index.html
$SED -i 's:<span><strong>Guia de Estilos de Sidra</strong></span><br />:<h3>Guia de Estilos de Sidra</h3>:g' html/index.html
$SED -i 's@<span id="fig:bjcp-logo" label="fig:bjcp-logo">\[fig:bjcp-logo\]</span>@@g' html/index.html
$SED -i 's@<img src="assets/bjcp-logo.png" alt="image" />@<img src="assets/bjcp-logo.png" alt="Logo do BJCP - Beer Judge Certification Program" />@g' html/index.html

echo "Pronto: html/index.html"
open html/index.html 2>/dev/null || xdg-open html/index.html 2>/dev/null || echo "Abra html/index.html manualmente no navegador."
