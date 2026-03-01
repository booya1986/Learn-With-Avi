'use client'

import * as React from 'react'

import { Search, X } from 'lucide-react'

import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  delay?: number
  className?: string
}

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search...',
  delay = 300,
  className,
}: SearchInputProps) => {
  const [internalValue, setInternalValue] = React.useState(value)
  const timeoutRef = React.useRef<NodeJS.Timeout>(undefined)

  React.useEffect(() => {
    setInternalValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInternalValue(newValue)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      onChange(newValue)
    }, delay)
  }

  const handleClear = () => {
    setInternalValue('')
    onChange('')
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
      <input
        type="text"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-white/20 bg-white/10 text-white ps-10 pe-10 text-sm placeholder:text-white/40 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
        aria-label={placeholder}
      />
      {internalValue ? <button
          onClick={handleClear}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button> : null}
    </div>
  )
}
