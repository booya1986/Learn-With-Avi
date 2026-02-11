# Storybook Configuration

Storybook is configured for the LearnWithAvi project to provide interactive component documentation.

## Overview

- **Framework**: React with Vite (faster than Webpack)
- **Version**: Storybook 8.6.x
- **Addons**: Links, Essentials, Interactions, Accessibility (a11y)
- **Auto-docs**: Enabled via `tags: ['autodocs']` in stories

## Running Storybook

### Development Mode

Start the Storybook development server:

```bash
npm run storybook
```

This will start Storybook at [http://localhost:6006/](http://localhost:6006/)

### Build for Production

Build a static version of Storybook:

```bash
npm run build-storybook
```

Output directory: `storybook-static/`

## Creating Stories

### Basic Story Structure

Create a `.stories.tsx` file next to your component:

```tsx
// src/components/ui/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'], // Enable auto-generated documentation
  parameters: {
    docs: {
      description: {
        component: 'Description of your component...',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline'],
      description: 'Visual style of the button',
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: {
    children: 'Click me',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
  parameters: {
    docs: {
      description: {
        story: 'Use for destructive actions like deleting data.',
      },
    },
  },
}
```

### Story Naming Convention

- **File**: `ComponentName.stories.tsx`
- **Location**: Same directory as component
- **Title**: Use `/` for organization (e.g., `'UI/Button'`, `'Components/Video/VideoPlayer'`)

## Features

### Auto-Documentation

Components tagged with `tags: ['autodocs']` automatically get:
- Props table (from TypeScript types)
- Description from JSDoc comments
- Interactive controls for all props
- Code examples

### Accessibility Testing

The `@storybook/addon-a11y` addon provides:
- WCAG compliance checks
- Color contrast validation
- Keyboard navigation testing
- Screen reader simulation

Run accessibility checks on any story using the "Accessibility" tab.

### Interactive Controls

Use the "Controls" tab to dynamically change component props and see live updates.

### Interactions Testing

Write interaction tests using `@storybook/addon-interactions`:

```tsx
import { userEvent, within } from '@storybook/test'

export const ClickButton: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button'))
  },
}
```

## Configuration Files

### `.storybook/main.ts`

Main configuration file:
- Stories location: `src/**/*.stories.@(js|jsx|mjs|ts|tsx)`
- Addons: links, essentials, interactions, a11y
- Framework: `@storybook/react-vite`
- Path aliases: `@/` → `src/`

### `.storybook/preview.ts`

Preview configuration:
- Global styles: Imports `src/app/globals.css` (Tailwind)
- Actions: Auto-detects `on*` event handlers
- Controls: Matchers for colors and dates
- Docs: Table of contents enabled

## Best Practices

### 1. Document All Variants

Create stories for every variant of your component:

```tsx
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
    </div>
  ),
}
```

### 2. Add Descriptions

Use `parameters.docs.description.story` to explain when and how to use each variant.

### 3. Test Edge Cases

Include stories for:
- Disabled states
- Loading states
- Error states
- Long content
- Empty content

### 4. Use Real Data

When possible, use realistic data from `src/lib/mock-data.ts` or similar.

### 5. Accessibility First

Ensure all stories pass a11y checks:
- Use semantic HTML
- Include ARIA labels where needed
- Test keyboard navigation
- Verify color contrast

## Troubleshooting

### Path Alias Issues

If you see `Failed to resolve import "@/..."`:
- Check `.storybook/main.ts` has the correct `viteFinal` configuration
- Verify `tsconfig.json` has `"@/*": ["./src/*"]`

### Tailwind Styles Not Loading

Ensure `.storybook/preview.ts` imports your global CSS:

```ts
import '../src/app/globals.css'
```

### Component Not Rendering

Check for:
- Missing dependencies in component imports
- Server-side only code (use `if (typeof window !== 'undefined')`)
- NextAuth or other Next.js specific features (mock them in stories)

## Resources

- [Storybook Documentation](https://storybook.js.org/docs/react/get-started/introduction)
- [Writing Stories](https://storybook.js.org/docs/react/writing-stories/introduction)
- [Accessibility Addon](https://storybook.js.org/addons/@storybook/addon-a11y)
- [Interaction Testing](https://storybook.js.org/docs/react/writing-tests/interaction-testing)
