// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Guia de Estilos de Sidra BJCP - 2025',
  tagline: 'Diretrizes de Estilo de Sidra do BJCP - Tradução PT-BR',
  favicon: 'img/bjcp-logo.png',

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

  themes: [
    [
      // Busca local, indexada no build — sem depender de serviço externo
      // (Algolia exige cadastro/aprovação e uma API key de terceiro).
      '@easyops-cn/docusaurus-search-local',
      /** @type {import('@easyops-cn/docusaurus-search-local').PluginOptions} */
      ({
        hashed: true,
        language: ['pt'],
        indexDocs: true,
        indexBlog: false,
        docsRouteBasePath: '/',
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/bjcp-logo.png',
      docs: {
        sidebar: {
          hideable: true,
        },
      },
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Guia de Estilos de Sidra BJCP - 2025',
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
