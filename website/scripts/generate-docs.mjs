#!/usr/bin/env node
// Converte os .tex (fonte original) em Markdown para o Docusaurus consumir.
// Roda sempre a partir do .tex — nunca edite os arquivos gerados em
// website/docs/, eles são recriados do zero a cada execução (ver
// website/scripts/README.md).
import {execFileSync} from 'node:child_process';
import {mkdirSync, rmSync, writeFileSync, readFileSync, readdirSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const docsDir = path.join(__dirname, '../docs');

// Ordem e agrupamento espelham exatamente os \input de main.tex.
// `files: null` = pega todos os .tex do diretório (exceto header.tex/index.tex),
// em ordem alfabética (funciona pois os arquivos de estilo já são prefixados
// c1-a-, c1-b-, ... nessa ordem). Onde a ordem não é alfabética (ex.: a
// introdução às diretrizes 2025), liste os arquivos explicitamente.
const MANIFEST = [
  {
    dir: 'introduction-to-cider-and-perry-styles',
    slug: 'introducao-aos-estilos-de-sidra-e-perada',
    files: [],
  },
  {
    dir: 'introduction-to-the-2025-cider-guidelines',
    slug: 'introducao-as-diretrizes-2025',
    files: [
      'aroma-and-flavor.tex',
      'appearance.tex',
      'mouthfeel.tex',
      'ingredients.tex',
      'entry-instructions.tex',
    ],
  },
  {dir: 'c1-traditional-cider', slug: 'c1-traditional-cider', files: null},
  {dir: 'c2-strong-cider', slug: 'c2-strong-cider', files: null},
  {dir: 'c3-specialty-cider', slug: 'c3-specialty-cider', files: null},
  {dir: 'c4-perry', slug: 'c4-perry', files: null},
];

function sh(cmd, args) {
  return execFileSync(cmd, args, {encoding: 'utf8'});
}

function pandocLatexToMd(absTexPath) {
  const rel = path.relative(repoRoot, absTexPath);
  // O entrypoint da imagem pandoc/core só repassa pro `pandoc` quando o
  // primeiro argumento começa com "-"; senão tenta dar exec no arquivo.
  // Por isso as flags vêm antes do nome do arquivo aqui.
  return sh('docker', [
    'run',
    '--rm',
    '-v',
    `${repoRoot}:/data`,
    '-w',
    '/data',
    'pandoc/core:2.9',
    '-f',
    'latex',
    '-t',
    'gfm',
    rel,
  ]);
}

function extractTitle(absTexPath) {
  const content = readFileSync(absTexPath, 'utf8');
  const match = content.match(/\\(?:sub)?section\*\{([^}]*)\}/);
  if (!match) {
    throw new Error(`Não encontrei \\section*{} ou \\subsection*{} em ${absTexPath}`);
  }
  return match[1].replace(/\\break/g, ' ').trim();
}

function yamlEscape(value) {
  if (typeof value !== 'string') return String(value);
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function writeMdWithFrontmatter(targetPath, title, body, extraFrontmatter = {}) {
  // O título já vem do frontmatter (Docusaurus renderiza como <h1>), então
  // tira o heading duplicado que o pandoc gera a partir do \section*/\subsection*.
  const withoutHeading = body.replace(/^#{1,2} .*\n+/, '');
  const lines = [`title: ${yamlEscape(title)}`];
  for (const [key, value] of Object.entries(extraFrontmatter)) {
    lines.push(`${key}: ${yamlEscape(value)}`);
  }
  const frontmatter = `---\n${lines.join('\n')}\n---\n\n`;
  writeFileSync(targetPath, frontmatter + withoutHeading);
}

console.log('Limpando website/docs/ ...');
rmSync(docsDir, {recursive: true, force: true});
mkdirSync(docsDir, {recursive: true});

// frontpage.tex não segue o padrão \section*/\subsection* dos demais
// arquivos (é a página de capa: título, logo, créditos de tradução,
// versão, data, contato) — por isso é tratada à parte, fora do MANIFEST,
// e vira a home do site ('/').
console.log('[capa] frontpage.tex -> capa.md');
const frontpageMd = pandocLatexToMd(path.join(repoRoot, 'frontpage.tex'))
  // artefato do pandoc pra referência de figura do LaTeX, sem equivalente em markdown
  .replace(/<span id="fig:bjcp-logo"[^>]*>.*?<\/span>\n?/, '')
  // As 4 linhas de título da capa (hoje só bold, sem hierarquia) viram
  // headings de verdade — mesmo tratamento que o pipeline HTML antigo já
  // fazia via sed (ver docs/build/README.md), só que também cobrindo a
  // linha "(incluindo Perada)", que a versão antiga deixava de fora.
  // Usa tag HTML literal (não `#`/`##` do markdown) de propósito: assim
  // não entra no TOC lateral autogerado do Docusaurus, que só olha
  // headings em sintaxe markdown.
  .replace(/<span>\*\*BEER JUDGE CERTIFICATION PROGRAM\*\*<\/span>\s*/, '<h1>BEER JUDGE CERTIFICATION PROGRAM</h1>\n\n')
  .replace(/<span>\*\*Guia de Estilos 2025\*\*\s*<\/span>\s*/, '<h2>Guia de Estilos 2025</h2>\n\n')
  .replace(/<span>\*\*Guia de Estilos de Sidra\*\*<\/span>\s*/, '<h3>Guia de Estilos de Sidra</h3>\n\n')
  .replace(/<span>\*\*\(incluindo Perada\)\*\*<\/span>\s*/, '<h4>(incluindo Perada)</h4>\n\n')
  // O resto dos <span> sem classe/estilo é o que sobra do
  // \fontsize{}{}\selectfont do LaTeX (pandoc não tem pra onde mapear o
  // tamanho de fonte). Como <span> é HTML inline, o MDX não separa em
  // parágrafos as linhas em branco entre eles — tudo flui grudado em vez
  // de virar blocos distintos. Como não carregam nenhum estilo de
  // verdade, removemos e deixamos markdown puro, que respeita linha em
  // branco = parágrafo novo.
  .replace(/<\/?span[^>]*>/g, '')
  // a imagem é referenciada como assets/bjcp-logo.png (relativo à raiz do
  // repo); copiamos o arquivo pra perto do .md gerado e reescrevemos o
  // caminho, pra o bundler do Docusaurus resolver o asset corretamente
  // (inclusive respeitando o baseUrl) em vez de um link absoluto quebrado.
  .replace('assets/bjcp-logo.png', './bjcp-logo.png');
copyFileSync(path.join(repoRoot, 'assets/bjcp-logo.png'), path.join(docsDir, 'bjcp-logo.png'));
writeMdWithFrontmatter(
  path.join(docsDir, 'capa.md'),
  'BJCP Diretrizes de Estilo de Sidra - Edição 2025',
  frontpageMd,
  {
    slug: '/',
    sidebar_position: 0,
    sidebar_label: 'Capa',
    // O próprio conteúdo da capa já traz o título em destaque (replica o
    // layout do frontpage.tex); um <h1> automático em cima ficaria redundante.
    hide_title: true,
  },
);

MANIFEST.forEach((entry, index) => {
  const srcDir = path.join(repoRoot, entry.dir);
  const targetDir = path.join(docsDir, entry.slug);
  mkdirSync(targetDir, {recursive: true});

  const headerPath = path.join(srcDir, 'header.tex');
  const categoryLabel = extractTitle(headerPath);

  writeFileSync(
    path.join(targetDir, '_category_.json'),
    JSON.stringify({label: categoryLabel, position: index + 1}, null, 2) + '\n',
  );

  console.log(`[${index + 1}/${MANIFEST.length}] ${entry.dir} -> ${entry.slug}/ ("${categoryLabel}")`);

  const headerMd = pandocLatexToMd(headerPath);
  writeMdWithFrontmatter(path.join(targetDir, 'index.md'), categoryLabel, headerMd);

  const files =
    entry.files ??
    readdirSync(srcDir)
      .filter((f) => f.endsWith('.tex') && f !== 'header.tex' && f !== 'index.tex')
      .sort();

  files.forEach((file) => {
    const absPath = path.join(srcDir, file);
    const slug = file.replace(/\.tex$/, '');
    const title = extractTitle(absPath);
    const md = pandocLatexToMd(absPath);
    writeMdWithFrontmatter(path.join(targetDir, `${slug}.md`), title, md);
    console.log(`    ${file} -> ${entry.slug}/${slug}.md ("${title}")`);
  });
});

console.log('Pronto. website/docs/ gerado a partir dos .tex.');
