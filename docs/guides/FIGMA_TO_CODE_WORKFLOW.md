# Figma to Code Workflow for LearnWithAvi

This guide demonstrates practical workflows for converting Figma designs into React components for the LearnWithAvi platform using the Figma MCP server.

## Prerequisites

- ✅ Figma MCP server installed (see [FIGMA_MCP_SETUP.md](../configuration/FIGMA_MCP_SETUP.md))
- ✅ Access to your Figma design files
- ✅ Claude Code configured and running

---

## Workflow 1: Creating UI Components

### Scenario: Designer creates a new Course Card design

**Step 1: Design in Figma**
- Designer creates course card component in Figma
- Includes: thumbnail, title, description, progress bar, CTA button
- Defines states: default, hover, completed
- Adds Hebrew (RTL) variant

**Step 2: Share Design**
- Right-click frame in Figma → Copy link
- Share link with developer/Claude Code

**Step 3: Generate Component**

```typescript
// Prompt for Claude Code:
"Generate a CourseCard React component from this Figma design:
https://www.figma.com/file/ABC123/LearnWithAvi?node-id=42:100

Requirements:
- Match existing component structure in src/components/CourseCard.tsx
- Use TypeScript with proper interfaces
- Apply Tailwind CSS classes
- Support RTL for Hebrew
- Include hover states
- Make responsive (mobile, tablet, desktop)
- Follow our naming conventions

The component should accept these props:
- course: Course (from src/types/index.ts)
- onEnroll: () => void
- progress?: number
"
```

**Step 4: Review & Refine**

Claude will:
1. Fetch design data via Figma MCP
2. Extract colors, spacing, typography
3. Generate TypeScript component
4. Match project conventions
5. Add proper types and props

**Step 5: Integrate**

```bash
# Claude automatically places in correct location:
# src/components/CourseCard.tsx

# Then update imports in pages that use it
```

---

## Workflow 2: Building Admin Panel Layouts

### Scenario: Create Course Management Dashboard

**Step 1: Prompt with Context**

```typescript
"Implement this admin dashboard layout from Figma:
https://www.figma.com/file/ABC123/Admin-Panel?node-id=10:50

This goes in: src/app/admin/courses/page.tsx

Use our existing components:
- DataTable from src/components/admin/common/DataTable.tsx
- SearchInput from src/components/admin/common/SearchInput.tsx
- Button from src/components/ui/button.tsx

Requirements:
- Next.js 15 App Router (Server Component)
- Fetch data using Prisma client
- Include sorting, filtering, pagination
- Match our admin panel theme (dark mode)
- Add Hebrew RTL support
"
```

**Step 2: Claude Generates**

```typescript
// Generated file: src/app/admin/courses/page.tsx

import { DataTable } from '@/components/admin/common/DataTable'
import { SearchInput } from '@/components/admin/common/SearchInput'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    include: { videos: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="container mx-auto p-6 rtl:text-right">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ניהול קורסים</h1>
        <Button href="/admin/courses/new">קורס חדש</Button>
      </div>

      <SearchInput placeholder="חיפוש קורסים..." />

      <DataTable
        data={courses}
        columns={[
          { key: 'title', label: 'שם הקורס' },
          { key: 'videoCount', label: 'מספר סרטונים' },
          { key: 'status', label: 'סטטוס' }
        ]}
      />
    </div>
  )
}
```

---

## Workflow 3: Extracting Design Tokens

### Scenario: Sync Figma Variables with Tailwind Config

**Step 1: Extract Variables**

```typescript
"Analyze the design variables in this Figma file:
https://www.figma.com/file/ABC123/Design-System

Extract:
- Color palette (primary, secondary, neutral, semantic)
- Typography scale (font families, sizes, weights, line heights)
- Spacing scale
- Border radius values
- Shadow styles

Generate a tailwind.config.ts that matches these exactly."
```

**Step 2: Claude Generates Config**

```typescript
// Updated tailwind.config.ts

import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... extracted from Figma variables
          500: '#0ea5e9',
          900: '#0c4a6e'
        },
        // Hebrew-friendly semantic colors
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      fontFamily: {
        sans: ['Heebo', 'system-ui', 'sans-serif'], // RTL Hebrew font
        mono: ['Fira Code', 'monospace']
      },
      fontSize: {
        // Extracted from Figma typography
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        // ...
      },
      spacing: {
        // Figma spacing scale
        '4.5': '1.125rem', // 18px
        '18': '4.5rem',    // 72px
      },
      borderRadius: {
        'card': '0.75rem',
        'button': '0.5rem',
      }
    }
  },
  plugins: []
}

export default config
```

---

## Workflow 4: Responsive Component from Frames

### Scenario: Mobile, Tablet, Desktop Variants

**Step 1: Multi-Frame Prompt**

```typescript
"Create a responsive VideoPlayer component using these Figma frames:
- Mobile: https://www.figma.com/file/ABC?node-id=100:1
- Tablet: https://www.figma.com/file/ABC?node-id=100:2
- Desktop: https://www.figma.com/file/ABC?node-id=100:3

Implement responsive behavior with Tailwind breakpoints:
- Mobile: full width, controls overlay
- Tablet: 16:9 ratio, side panel for chapters
- Desktop: player left, chapters right, transcript bottom

Match these breakpoints:
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
"
```

**Step 2: Claude Analyzes All Frames**

Claude fetches data from all three frames, identifies differences, and generates a responsive component with appropriate breakpoints.

---

## Workflow 5: Building Forms

### Scenario: Course Creation Form

**Step 1: Detailed Prompt**

```typescript
"Implement this course creation form from Figma:
https://www.figma.com/file/ABC/Forms?node-id=50:100

Requirements:
- Use React Hook Form for validation
- Zod schema for TypeScript types
- Server Action for submission (Next.js 15)
- Error states matching Figma error styles
- Success toast notification
- Hebrew RTL labels
- File upload for thumbnail (drag & drop)

Form fields:
- title (required, min 3 chars)
- description (required, max 500 chars)
- category (select from categories)
- thumbnail (image upload)
- isPublished (toggle)
"
```

**Step 2: Generated Form Component**

```typescript
// src/components/admin/courses/CourseForm.tsx

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const courseSchema = z.object({
  title: z.string().min(3, 'כותרת חייבת להכיל לפחות 3 תווים'),
  description: z.string().max(500, 'תיאור ארוך מדי'),
  category: z.string(),
  thumbnail: z.instanceof(File).optional(),
  isPublished: z.boolean().default(false)
})

type CourseFormData = z.infer<typeof courseSchema>

export function CourseForm({ onSubmit }: { onSubmit: (data: CourseFormData) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema)
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rtl:text-right">
      {/* Form fields with Hebrew labels and RTL support */}
      <div>
        <label className="block text-sm font-medium mb-2">כותרת הקורס</label>
        <Input {...register('title')} dir="rtl" />
        {errors.title && <p className="text-error text-sm mt-1">{errors.title.message}</p>}
      </div>

      {/* ... other fields */}

      <Button type="submit">יצירת קורס</Button>
    </form>
  )
}
```

---

## Workflow 6: Interactive Components

### Scenario: Video Player with Chapters

**Step 1: Complex Component Prompt**

```typescript
"Create an interactive VideoPlayer component from this Figma prototype:
https://www.figma.com/proto/ABC/Player?node-id=1:1

Features to implement:
- YouTube iframe player integration
- Chapter navigation sidebar (collapsible on mobile)
- Click chapter → seek to timestamp
- Progress bar showing chapter boundaries
- Auto-highlight current chapter as video plays
- Keyboard shortcuts (space = play/pause, arrows = seek)
- RTL support for Hebrew chapter titles

State management:
- currentTime: number
- isPlaying: boolean
- currentChapter: Chapter | null
- duration: number

Props:
interface VideoPlayerProps {
  videoId: string
  chapters: Chapter[]
  onProgress?: (progress: number) => void
}
"
```

**Step 2: Claude Generates Interactive Component**

Includes:
- YouTube Player API integration
- State hooks for playback control
- Chapter sync logic
- Keyboard event handlers
- Responsive sidebar
- RTL-aware layout

---

## Best Practices

### 1. Reference Existing Code

Always tell Claude to match existing patterns:
```
"Match the structure of src/components/admin/videos/VideoForm.tsx"
"Use the same error handling as src/app/api/admin/courses/route.ts"
```

### 2. Specify Tech Stack

Be explicit about technologies:
```
"Use Next.js 15 App Router, not Pages Router"
"Use Tailwind CSS, not styled-components"
"TypeScript strict mode"
```

### 3. Include Type Definitions

Reference your types:
```
"Use Course type from src/types/index.ts"
"Props should extend VideoPlayerProps interface"
```

### 4. Mention RTL Requirements

For Hebrew support:
```
"Add RTL support with dir='rtl' and Tailwind RTL utilities"
"Use ps-4 instead of pl-4 for RTL-aware padding"
```

### 5. Request Accessibility

```
"Add ARIA labels for screen readers"
"Ensure keyboard navigation works"
"Meet WCAG 2.1 AA standards"
```

---

## Troubleshooting

### Issue: Generated code doesn't match project structure

**Solution**: Be more specific about file paths and existing patterns
```
"Place in src/app/admin/courses/[id]/edit/page.tsx"
"Import types from @/types (use @ alias)"
"Match the component structure in src/components/admin/common/"
```

### Issue: Styling doesn't match Figma exactly

**Solution**: Extract specific values
```
"Use exactly these colors: #0ea5e9, #1e293b"
"Spacing should be: 16px, 24px, 32px (use Tailwind tokens)"
"Font: Heebo 16px/24px (1rem/1.5rem)"
```

### Issue: Missing responsive behavior

**Solution**: Specify breakpoints explicitly
```
"Mobile (<768px): stack vertically"
"Tablet (768-1024px): 2-column grid"
"Desktop (>1024px): 3-column grid with sidebar"
```

---

## Examples from LearnWithAvi

### Real Components You Can Reference

When generating new components, ask Claude to match these existing patterns:

**Video Player**:
```
"Match the structure of src/components/video/VideoPlayer.tsx"
```

**Admin Forms**:
```
"Follow the pattern in src/components/admin/videos/VideoForm.tsx"
```

**Data Tables**:
```
"Use DataTable component from src/components/admin/common/DataTable.tsx"
```

**Chat Interface**:
```
"Similar layout to src/components/chat/ChatPanel.tsx"
```

---

## Quick Reference

### Essential Commands

**Generate component**:
```
"Create [ComponentName] from [Figma link] with [requirements]"
```

**Update existing**:
```
"Update src/components/[file] to match [Figma link]"
```

**Extract tokens**:
```
"Extract design variables from [Figma link] to tailwind.config.ts"
```

**Build page**:
```
"Implement page at src/app/[path] from [Figma link]"
```

### Pro Tips

1. **Start Simple**: Get basic structure first, then add details
2. **Iterate**: Refine in multiple prompts rather than one huge prompt
3. **Test**: Ask Claude to generate test cases for components
4. **Document**: Request JSDoc comments for complex components
5. **Optimize**: Ask for performance optimizations after functionality works

---

## Next Steps

1. ✅ Set up Figma MCP (if not done): [FIGMA_MCP_SETUP.md](../configuration/FIGMA_MCP_SETUP.md)
2. 🎨 Get your Figma designs ready
3. 🚀 Start with simple components first
4. 📈 Build up to complex layouts
5. 🔄 Iterate based on results

---

**Questions?** Ask Claude Code:
```
"Show me examples of converting Figma designs to React components"
"What information do you need from a Figma link to generate code?"
"How do I ensure the generated code matches my project structure?"
```

---

**Last Updated**: January 2026
**Related Docs**: [FIGMA_MCP_SETUP.md](../configuration/FIGMA_MCP_SETUP.md), [Component Guidelines](../architecture/components.md)
