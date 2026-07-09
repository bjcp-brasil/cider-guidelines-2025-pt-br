// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'BJCP Sidra 2025',
  tagline: 'Diretrizes de Estilo de Sidra do BJCP - Tradução PT-BR',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://bjcp-brasil.github.io',
  baseUrl: '/cider-guidelines-2025-pt-br/',

  organizationName: 'bjcp-brasil',
  projectName: 'cider-guidelines-2025-pt-br',

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          editUrl:
            'https://github.com/bjcp-brasil/cider-guidelines-2025-pt-br/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/bjcp-logo.png',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'BJCP Sidra 2025',
        logo: {
          alt: 'Logo do BJCP',
          src: 'img/bjcp-logo.png',
        },
        items: [
          {
            href: 'https://github.com/bjcp-brasil/cider-guidelines-2025-pt-br',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [],
        copyright: `BJCP Diretrizes de Estilo de Sidra - Edição 2025 - Tradução PT-BR mantida por BJCP Brasil`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
