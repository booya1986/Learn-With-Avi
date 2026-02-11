import type { Preview } from '@storybook/react'
import '../src/app/globals.css' // Include global Tailwind CSS styles

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true, // Enable table of contents in docs
    },
  },
}

export default preview
