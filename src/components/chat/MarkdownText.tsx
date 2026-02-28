'use client'

import React, { useMemo } from 'react'

/**
 * Process inline markdown elements (bold, italic, inline code).
 * Returns an array of React nodes (strings and elements).
 */
export function processInlineMarkdown(text: string): React.ReactNode {
  const elements: React.ReactNode[] = []
  let lastIndex = 0

  const inlineRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g
  let match

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index))
    }

    if (match[1]) {
      elements.push(
        <strong key={match.index} className="font-semibold">
          {match[2]}
        </strong>
      )
    } else if (match[3]) {
      elements.push(
        <em key={match.index} className="italic">
          {match[4]}
        </em>
      )
    } else if (match[5]) {
      elements.push(
        <code
          key={match.index}
          className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono"
        >
          {match[6]}
        </code>
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex))
  }

  return elements.length > 0 ? elements : text
}

/**
 * Renders a string with basic markdown support:
 * headings (# ## ###), bullet/numbered lists, inline bold/italic/code, and line breaks.
 */
export const MarkdownText = ({ text }: { text: string }) => {
  const rendered = useMemo(() => {
    const lines = text.split('\n')

    return lines.map((line, lineIndex) => {
      const processedLine = processInlineMarkdown(line)

      if (line.startsWith('### ')) {
        return (
          <h3 key={lineIndex} className="font-semibold text-base mt-3 mb-1">
            {processInlineMarkdown(line.slice(4))}
          </h3>
        )
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={lineIndex} className="font-semibold text-lg mt-3 mb-1">
            {processInlineMarkdown(line.slice(3))}
          </h2>
        )
      }
      if (line.startsWith('# ')) {
        return (
          <h1 key={lineIndex} className="font-bold text-xl mt-3 mb-2">
            {processInlineMarkdown(line.slice(2))}
          </h1>
        )
      }

      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={lineIndex} className="ms-4 list-disc">
            {processInlineMarkdown(line.slice(2))}
          </li>
        )
      }

      const numberedMatch = line.match(/^(\d+)\.\s/)
      if (numberedMatch) {
        return (
          <li key={lineIndex} className="ms-4 list-decimal">
            {processInlineMarkdown(line.slice(numberedMatch[0].length))}
          </li>
        )
      }

      if (line.startsWith('```')) {
        return null
      }

      if (line.trim() === '') {
        return <br key={lineIndex} />
      }

      return (
        <span key={lineIndex}>
          {processedLine}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      )
    })
  }, [text])

  return <>{rendered}</>
}
