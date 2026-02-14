# Component Patterns for Figma-to-Code Conversion

This document provides reusable patterns for converting Figma designs to React components in LearnWithAvi.

## Component Categories

### 1. UI Primitives (shadcn/ui style)

#### Button
```typescript
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary-500 text-white hover:bg-primary-600',
        outline: 'border border-gray-300 hover:bg-gray-50',
        ghost: 'hover:bg-gray-100'
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

#### Input
```typescript
import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        className={cn(
          'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2',
          'text-sm placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'rtl:text-right', // RTL support
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### 2. Layout Components

#### Card Container
```typescript
import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg p-6',
          {
            'bg-white shadow-sm': variant === 'default',
            'bg-white shadow-lg': variant === 'elevated',
            'border border-gray-200 bg-white': variant === 'outlined'
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
```

#### Responsive Grid
```typescript
interface GridProps {
  children: React.ReactNode
  columns?: { mobile?: number; tablet?: number; desktop?: number }
  gap?: number
}

export function Grid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 6
}: GridProps) {
  return (
    <div
      className={cn(
        'grid',
        `grid-cols-${columns.mobile}`,
        `md:grid-cols-${columns.tablet}`,
        `lg:grid-cols-${columns.desktop}`,
        `gap-${gap}`
      )}
    >
      {children}
    </div>
  )
}
```

### 3. Form Components

#### Form Field with Label and Error
```typescript
interface FormFieldProps {
  label: string
  error?: string
  children: React.ReactNode
  required?: boolean
}

export function FormField({ label, error, children, required }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 rtl:text-right">
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600 rtl:text-right">{error}</p>
      )}
    </div>
  )
}
```

#### Select Dropdown
```typescript
import { SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2',
          'text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'rtl:text-right',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    )
  }
)
```

### 4. Interactive Components

#### Modal/Dialog
```typescript
'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-xl font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  )
}
```

#### Tabs
```typescript
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  return (
    <div>
      {/* Tab List */}
      <div
        className="flex border-b border-gray-200"
        role="tablist"
        aria-label="Tabs"
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {tabs.map(tab => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={tab.id}
          hidden={activeTab !== tab.id}
          className="py-4"
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}
```

### 5. Responsive Patterns

#### Mobile/Desktop Layout Switch
```typescript
export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4">
      {/* Mobile: Stack vertically */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content - full width on mobile, flex-1 on desktop */}
        <main className="flex-1">{children}</main>

        {/* Sidebar - below on mobile, right side on desktop */}
        <aside className="w-full lg:w-80 space-y-6">
          {/* Sidebar content */}
        </aside>
      </div>
    </div>
  )
}
```

#### Collapsible Sidebar
```typescript
'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function CollapsibleSidebar({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 start-4 z-50 p-2 bg-white rounded-md shadow"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 start-0 z-40 w-64 bg-white shadow-lg',
          'transform transition-transform duration-200 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {children}
      </aside>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
```

### 6. RTL Patterns

#### RTL-Aware Flex Layout
```typescript
// Automatically reverses in RTL
<div className="flex gap-4">
  <div className="ms-auto">Right side in LTR, Left side in RTL</div>
</div>

// Explicit direction control
<div dir="rtl" className="flex items-center gap-2">
  <span>מלל בעברית</span>
  <button>כפתור</button>
</div>
```

#### RTL-Safe Icons
```typescript
import { ArrowLeft, ArrowRight } from 'lucide-react'

function BackButton() {
  return (
    <button className="flex items-center gap-2">
      {/* Shows left arrow in LTR, right arrow in RTL */}
      <ArrowLeft className="rtl:hidden" />
      <ArrowRight className="ltr:hidden" />
      <span>Back / חזרה</span>
    </button>
  )
}
```

### 7. Accessibility Patterns

#### Keyboard Navigation
```typescript
function KeyboardNavigable() {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      // Trigger action
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      Clickable div
    </div>
  )
}
```

#### Screen Reader Only Content
```typescript
// Visible to screen readers, hidden visually
<span className="sr-only">Additional context for screen readers</span>

// Skip to main content link
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4"
>
  Skip to main content
</a>
```

## Conversion Checklist

When converting a Figma design to React:

### Structure
- [ ] Identify component hierarchy
- [ ] Determine if client or server component
- [ ] Plan state management approach
- [ ] Consider component composition

### Styling
- [ ] Extract colors, spacing, typography
- [ ] Match design tokens to Tailwind config
- [ ] Implement hover/active/disabled states
- [ ] Add responsive breakpoints

### Accessibility
- [ ] Add ARIA labels
- [ ] Ensure keyboard navigation
- [ ] Check color contrast (4.5:1 minimum)
- [ ] Test with screen reader

### RTL Support
- [ ] Use `ps-*` / `pe-*` instead of `pl-*` / `pr-*`
- [ ] Use `ms-*` / `me-*` instead of `ml-*` / `mr-*`
- [ ] Use `text-start` / `text-end` instead of `text-left` / `text-right`
- [ ] Add `dir="rtl"` where needed

### TypeScript
- [ ] Define prop interfaces
- [ ] Add proper types (no `any`)
- [ ] Export types that may be reused
- [ ] Extend existing types where appropriate

### Testing
- [ ] Component renders without errors
- [ ] Responsive behavior works
- [ ] RTL layout is correct
- [ ] Accessibility features function
- [ ] States (hover, active, etc.) display correctly

---

**Reference**: Use these patterns when converting Figma designs to ensure consistency with LearnWithAvi codebase.
