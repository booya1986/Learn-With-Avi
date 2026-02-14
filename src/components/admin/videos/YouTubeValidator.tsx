'use client'

import * as React from 'react'

import { Check, Loader2, AlertCircle } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface YouTubeMetadata {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: number
  channelTitle: string
  publishedAt: string
}

interface YouTubeValidatorProps {
  value: string
  onChange: (url: string) => void
  onValidated: (metadata: YouTubeMetadata | null) => void
  className?: string
}

export const YouTubeValidator = ({
  value,
  onChange,
  onValidated,
  className,
}: YouTubeValidatorProps) => {
  const [isValidating, setIsValidating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [metadata, setMetadata] = React.useState<YouTubeMetadata | null>(null)
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  React.useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (!value) {
      setError(null)
      setMetadata(null)
      onValidated(null)
      return
    }

    timeoutRef.current = setTimeout(() => {
      validateUrl(value)
    }, 500)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value])

  const validateUrl = async (url: string) => {
    setIsValidating(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/youtube/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to validate YouTube URL')
        setMetadata(null)
        onValidated(null)
        return
      }

      if (data.valid && data.metadata) {
        setMetadata(data.metadata)
        setError(null)
        onValidated(data.metadata)
      } else {
        setError(data.error || 'Invalid YouTube URL')
        setMetadata(null)
        onValidated(null)
      }
    } catch (err) {
      setError('Failed to validate YouTube URL')
      setMetadata(null)
      onValidated(null)
    } finally {
      setIsValidating(false)
    }
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <Label htmlFor="youtube-url">YouTube URL *</Label>
        <div className="relative mt-1">
          <Input
            id="youtube-url"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className={cn(
              'pe-10',
              error && 'border-red-500 focus-visible:ring-red-500/20',
              metadata && 'border-green-500 focus-visible:ring-green-500/20'
            )}
          />
          <div className="absolute end-3 top-1/2 -translate-y-1/2">
            {isValidating ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : null}
            {!isValidating && metadata ? <Check className="h-4 w-4 text-green-600" /> : null}
            {!isValidating && error ? <AlertCircle className="h-4 w-4 text-red-600" /> : null}
          </div>
        </div>
        {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
      </div>

      {metadata ? <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex gap-4">
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="h-24 w-40 rounded object-cover"
            />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{metadata.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{metadata.channelTitle}</p>
              <p className="mt-1 text-sm text-gray-500">
                Duration: {formatDuration(metadata.duration)}
              </p>
            </div>
          </div>
        </div> : null}
    </div>
  )
}
