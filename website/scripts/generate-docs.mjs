#!/usr/bin/env node
// Converte os .tex (fonte original) em Markdown para o Docusaurus consumir.
// Roda sempre a partir do .tex — nunca edite os arquivos gerados em
// website/docs/, eles são recriados do zero a cada execução (ver
// website/scripts/README.md).
import {execFileSync} from 'node:child_process';
import {mkdirSync, rmSync, writeFileSync, readFileSync, readdirSync} from 'node:fs';
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

function yamlEscape(str) {
  return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
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
  // A primeira categoria vira a home do site ('/'), já que o modo docs-only
  // não tem homepage própria — sem isso o link da navbar/logo fica quebrado.
  const extraFrontmatter = index === 0 ? {slug: '/'} : {};
  writeMdWithFrontmatter(path.join(targetDir, 'index.md'), categoryLabel, headerMd, extraFrontmatter);

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
