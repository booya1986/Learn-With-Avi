# Figma-to-Code Skill

**Purpose**: Convert Figma designs to React/TypeScript components for LearnWithAvi platform using Figma MCP integration.

## When to Use This Skill

Invoke this skill when:
- User provides a Figma design link
- Task requires converting UI designs to code
- Need to extract design tokens from Figma
- Creating new components from mockups
- Implementing responsive layouts from Figma prototypes

## Prerequisites

- Figma MCP server must be installed and authenticated
- Access to Figma files being referenced
- Understanding of LearnWithAvi component patterns

## How This Skill Works

### 1. Design Analysis Phase
- Fetches design data from Figma via MCP
- Extracts layout structure, styles, and content
- Identifies component states (hover, active, disabled)
- Analyzes responsive breakpoints
- Checks for design tokens/variables

### 2. Code Generation Phase
- Generates TypeScript React component
- Applies Tailwind CSS matching exact design
- Ensures RTL (Hebrew) compatibility
- Adds proper TypeScript types and props
- Includes accessibility features (ARIA labels)
- Implements responsive behavior

### 3. Integration Phase
- Matches existing project conventions
- Uses appropriate component patterns
- Imports types from `src/types/index.ts`
- Places component in correct directory
- Updates exports/imports as needed

## Skill Capabilities

### Component Generation
- **UI Components**: Buttons, cards, inputs, modals, etc.
- **Layout Components**: Headers, footers, navigation, grids
- **Page Layouts**: Full page implementations with sections
- **Forms**: Input fields, validation, error states
- **Interactive Elements**: Dropdowns, tabs, accordions

### Design Token Extraction
- **Colors**: Primary, secondary, semantic colors
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Padding, margin, gap values
- **Shadows**: Box shadows and elevations
- **Border Radius**: Rounded corners and shapes

### Responsive Behavior
- **Mobile**: <640px breakpoint
- **Tablet**: 640-1024px breakpoint
- **Desktop**: >1024px breakpoint
- **RTL Support**: Hebrew right-to-left layouts

## Usage Examples

### Example 1: Generate Button Component

**Input:**
```
Convert this Figma button to a React component:
https://www.figma.com/file/ABC123/Design?node-id=42:100

Requirements:
- Primary button variant
- Hover and disabled states
- RTL compatible
```

**Output:**
```typescript
// src/components/ui/primary-button.tsx

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary-500 text-white hover:bg-primary-600': variant === 'default',
            'border border-primary-500 text-primary-500 hover:bg-primary-50': variant === 'outline',
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-base': size === 'md',
            'h-12 px-6 text-lg': size === 'lg'
          },
          className
        )}
        {...props}
      />
    )
  }
)

PrimaryButton.displayName = 'PrimaryButton'
```

### Example 2: Extract Design Tokens

**Input:**
```
Extract color palette and typography from:
https://www.figma.com/file/ABC123/Design-System

Update tailwind.config.ts
```

**Output:**
```typescript
// Updated tailwind.config.ts

import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Extracted from Figma variables
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a'
        },
        secondary: {
          50: '#fdf4ff',
          500: '#a855f7',
          900: '#581c87'
        }
      },
      fontFamily: {
        sans: ['Heebo', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }]
      }
    }
  }
}

export default config
```

### Example 3: Build Responsive Page Layout

**Input:**
```
Implement course page layout from Figma:
- Mobile: https://www.figma.com/file/ABC?node-id=10:1
- Desktop: https://www.figma.com/file/ABC?node-id=10:2

Place in: src/app/course/[courseId]/page.tsx
```

**Output:**
```typescript
// src/app/course/[courseId]/page.tsx

import { VideoPlayer } from '@/components/video/VideoPlayer'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { CourseProgress } from '@/components/CourseProgress'
import { ChapterList } from '@/components/ChapterList'

export default function CoursePage({ params }: { params: { courseId: string } }) {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Mobile: Stack vertically */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Main content area */}
        <div className="flex-1 space-y-6">
          <VideoPlayer videoId={params.courseId} />
          <CourseProgress courseId={params.courseId} />

          {/* Mobile: Show chapters below video */}
          <div className="lg:hidden">
            <ChapterList courseId={params.courseId} />
          </div>
        </div>

        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <aside className="hidden lg:block w-80 space-y-6">
          <ChapterList courseId={params.courseId} />
          <ChatPanel />
        </aside>
      </div>

      {/* Mobile: Chat panel at bottom */}
      <div className="lg:hidden mt-6">
        <ChatPanel />
      </div>
    </div>
  )
}
```

## Best Practices

### 1. Match Project Conventions
- Use existing component patterns from `src/components/`
- Import types from `src/types/index.ts`
- Follow naming conventions (PascalCase for components)
- Use `@/` alias for imports

### 2. Ensure Accessibility
- Add ARIA labels to interactive elements
- Ensure keyboard navigation works
- Maintain 4.5:1 color contrast
- Include focus indicators
- Use semantic HTML

### 3. RTL Support (Critical for Hebrew)
- Use `ps-*` and `pe-*` instead of `pl-*` and `pr-*`
- Use `text-start` and `text-end` instead of `text-left` and `text-right`
- Add `dir="rtl"` where needed
- Test with Hebrew content

### 4. Responsive Design
- Mobile-first approach
- Use Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Test at 375px (mobile), 768px (tablet), 1440px (desktop)
- Consider touch targets (44x44px minimum)

### 5. TypeScript Type Safety
- Define proper prop interfaces
- Use strict types (no `any`)
- Extend existing types where appropriate
- Export types that may be reused

## Integration with LearnWithAvi

### Component Placement
- **UI primitives**: `src/components/ui/` (shadcn/ui)
- **Feature components**: `src/components/[feature]/`
- **Admin components**: `src/components/admin/`
- **Pages**: `src/app/[route]/page.tsx`

### Styling Approach
- **Framework**: Tailwind CSS 4
- **Components**: shadcn/ui + Radix UI
- **Custom utilities**: `src/lib/utils.ts` (`cn` function)
- **Config**: `tailwind.config.ts`

### State Management
- **Local state**: `useState`, `useReducer`
- **Global state**: React Context
- **Server state**: TanStack Query
- **Forms**: React Hook Form + Zod

## Common Patterns

### 1. Client Component Template
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ComponentProps } from '@/types'

interface MyComponentProps {
  title: string
  onAction: () => void
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState(false)

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Button onClick={onAction}>Action</Button>
    </div>
  )
}
```

### 2. Server Component Template
```typescript
import { prisma } from '@/lib/prisma'
import { CourseCard } from '@/components/CourseCard'

export default async function CoursesPage() {
  const courses = await prisma.course.findMany()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Courses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  )
}
```

### 3. Responsive Layout Pattern
```typescript
<div className="flex flex-col lg:flex-row gap-4">
  <main className="flex-1">
    {/* Main content */}
  </main>
  <aside className="w-full lg:w-80">
    {/* Sidebar - full width on mobile, fixed width on desktop */}
  </aside>
</div>
```

### 4. RTL-Safe Spacing
```typescript
<div className="ps-4 pe-2 ms-auto">
  {/* padding-inline-start: 1rem, padding-inline-end: 0.5rem */}
  {/* margin-inline-start: auto */}
</div>
```

## Troubleshooting

### Issue: Can't access Figma file

**Solution:**
- Verify Figma MCP is authenticated (`/mcp` in Claude Code)
- Check you have access to the Figma file
- Ensure link includes `?node-id=` parameter

### Issue: Generated code doesn't match project structure

**Solution:**
- Explicitly specify file paths and imports
- Reference existing components to match patterns
- Check component naming conventions

### Issue: RTL layout broken

**Solution:**
- Replace `pl-*` with `ps-*` (padding-inline-start)
- Replace `pr-*` with `pe-*` (padding-inline-end)
- Use `text-start` instead of `text-left`
- Test with `dir="rtl"` attribute

### Issue: Responsive breakpoints not working

**Solution:**
- Use Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Mobile-first: base styles are mobile, then add breakpoints
- Test at actual viewport sizes

## Reference Documentation

### Setup Guides
- [Figma MCP Setup](../../docs/configuration/FIGMA_MCP_SETUP.md)
- [Figma-to-Code Workflows](../../docs/guides/FIGMA_TO_CODE_WORKFLOW.md)
- [Quick Start](../../.figma-mcp-quickstart.md)

### Component Examples
- Video Player: `src/components/video/VideoPlayer.tsx`
- Chat Panel: `src/components/chat/ChatPanel.tsx`
- Course Card: `src/components/CourseCard.tsx`
- Admin Forms: `src/components/admin/videos/VideoForm.tsx`

### Configuration Files
- Tailwind Config: `tailwind.config.ts`
- TypeScript Config: `tsconfig.json`
- Type Definitions: `src/types/index.ts`

## Skill Workflow Checklist

When using this skill:

- [ ] Verify Figma MCP is connected
- [ ] Fetch design data from Figma link
- [ ] Analyze layout, styles, and interactions
- [ ] Check for existing similar components
- [ ] Generate TypeScript component with proper types
- [ ] Apply Tailwind CSS matching design
- [ ] Add RTL support for Hebrew
- [ ] Ensure accessibility (ARIA, keyboard nav)
- [ ] Implement responsive behavior
- [ ] Place in correct directory
- [ ] Update imports/exports
- [ ] Test component rendering

## Advanced Features

### Multi-Frame Responsive Components
When Figma has separate frames for mobile/tablet/desktop:
1. Fetch all frame variants
2. Identify differences (layout, spacing, visibility)
3. Generate single component with responsive breakpoints
4. Use Tailwind utilities to handle variations

### State Management from Figma
Extract component states from Figma variants:
- Default, Hover, Active, Disabled
- Light/Dark theme variants
- Different sizes (sm, md, lg)
- Loading states

### Design Token Sync
Keep Tailwind config in sync with Figma:
1. Extract Figma variables periodically
2. Update `tailwind.config.ts` with new tokens
3. Ensure component library uses design tokens
4. Maintain consistency between design and code

---

**Skill Version**: 1.0.0
**Last Updated**: January 2026
**Maintained By**: Frontend Engineer Agent
**Dependencies**: Figma MCP Server, Tailwind CSS, shadcn/ui
