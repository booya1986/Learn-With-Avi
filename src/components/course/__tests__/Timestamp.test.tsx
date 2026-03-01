import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { Timestamp } from '../Timestamp'

describe('Timestamp', () => {
  it('renders correctly with seconds prop', () => {
    render(<Timestamp seconds={125} />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('2:05')
  })

  it('formats time correctly (M:SS)', () => {
    const testCases = [
      { seconds: 0, expected: '0:00' },
      { seconds: 5, expected: '0:05' },
      { seconds: 45, expected: '0:45' },
      { seconds: 60, expected: '1:00' },
      { seconds: 125, expected: '2:05' },
      { seconds: 360, expected: '6:00' },
      { seconds: 725, expected: '12:05' },
    ]

    testCases.forEach(({ seconds, expected }) => {
      const { rerender } = render(<Timestamp seconds={seconds} />)
      expect(screen.getByRole('button')).toHaveTextContent(expected)
      rerender(<></>)
    })
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Timestamp seconds={125} onClick={handleClick} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn()
    render(<Timestamp seconds={125} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies active state styling', () => {
    render(<Timestamp seconds={125} isActive />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-500', 'text-white')
  })

  it('applies default state styling', () => {
    render(<Timestamp seconds={125} />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gray-100', 'dark:bg-gray-800')
  })

  it('has correct ARIA label', () => {
    render(<Timestamp seconds={125} />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Jump to 2:05')
  })

  it('is disabled when no onClick provided', () => {
    render(<Timestamp seconds={125} />)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('is not disabled when onClick provided', () => {
    render(<Timestamp seconds={125} onClick={() => {}} />)
    const button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
  })

  it('handles Enter key press', () => {
    const handleClick = vi.fn()
    render(<Timestamp seconds={125} onClick={handleClick} />)

    const button = screen.getByRole('button')
    fireEvent.keyDown(button, { key: 'Enter' })

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('handles Space key press', () => {
    const handleClick = vi.fn()
    render(<Timestamp seconds={125} onClick={handleClick} />)

    const button = screen.getByRole('button')
    fireEvent.keyDown(button, { key: ' ' })

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not trigger onClick on other key presses', () => {
    const handleClick = vi.fn()
    render(<Timestamp seconds={125} onClick={handleClick} />)

    const button = screen.getByRole('button')
    fireEvent.keyDown(button, { key: 'a' })
    fireEvent.keyDown(button, { key: 'Escape' })

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Timestamp seconds={125} className="custom-class" />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('has hover state when clickable', () => {
    render(<Timestamp seconds={125} onClick={() => {}} />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('hover:bg-gray-200', 'dark:hover:bg-gray-700', 'cursor-pointer')
  })

  it('does not have hover state when not clickable', () => {
    render(<Timestamp seconds={125} />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('cursor-default')
  })

  it('has focus-visible styles for accessibility', () => {
    render(<Timestamp seconds={125} onClick={() => {}} />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-blue-500')
  })

  it('forwards ref correctly', () => {
    const ref = { current: null }
    render(<Timestamp seconds={125} ref={ref as unknown as React.RefObject<HTMLButtonElement>} />)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})
