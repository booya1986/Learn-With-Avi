import type { StorybookConfig } from '@storybook/react-vite'
import { join } from 'path'
import react from '@vitejs/plugin-react'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation',
  },
  staticDirs: ['../public'],
  async viteFinal(config) {
    const { mergeConfig } = await import('vite')

    return mergeConfig(config, {
      plugins: [react({ jsxRuntime: 'automatic' })],
      resolve: {
        alias: {
          '@': join(__dirname, '..', 'src'),
        },
      },
    })
  },
}

export default config
