import type { StorybookConfig } from '@storybook/react-vite'
import { join, dirname } from 'path'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y', // Accessibility testing addon
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag', // Auto-generate docs for components with 'autodocs' tag
    defaultName: 'Documentation',
  },
  staticDirs: ['../public'],
  async viteFinal(config) {
    // Merge custom Vite configuration
    const { mergeConfig } = await import('vite')

    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': join(__dirname, '..', 'src'),
        },
      },
    })
  },
}

export default config
