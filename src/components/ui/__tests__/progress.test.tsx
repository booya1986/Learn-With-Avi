import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { Progress } from '../progress'

describe('Progress', () => {
  it('renders correctly with default props', () => {
    render(<Progress value={0} />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toBeInTheDocument()
  })

  it('displays correct ARIA attributes', () => {
    render(<Progress value={45} max={100} />)
    const progressbar = screen.getByRole('progressbar')

    expect(progressbar).toHaveAttribute('aria-valuenow', '45')
    expect(progressbar).toHaveAttribute('aria-valuemin', '0')
    expect(progressbar).toHaveAttribute('aria-valuemax', '100')
    expect(progressbar).toHaveAttribute('aria-label', '45% complete')
  })

  it('calculates percentage correctly', () => {
    const { container } = render(<Progress value={50} max={100} />)
    const fillBar = container.querySelector('[role="progressbar"] > div') as HTMLElement
    expect(fillBar?.style.width).toBe('50%')
  })

  it('handles 0% correctly', () => {
    const { container } = render(<Progress value={0} max={100} />)
    const fillBar = container.querySelector('[role="progressbar"] > div') as HTMLElement
    expect(fillBar?.style.width).toBe('0%')
  })

  it('handles 100% correctly', () => {
    const { container } = render(<Progress value={100} max={100} />)
    const fillBar = container.querySelector('[role="progressbar"] > div') as HTMLElement
    expect(fillBar?.style.width).toBe('100%')
  })

  it('handles values exceeding max (caps at 100%)', () => {
    const { container } = render(<Progress value={150} max={100} />)
    const fillBar = container.querySelector('[role="progressbar"] > div') as HTMLElement
    expect(fillBar?.style.width).toBe('100%')
  })

  it('handles negative values (floors at 0%)', () => {
    const { container } = render(<Progress value={-10} max={100} />)
    const fillBar = container.querySelector('[role="progressbar"] > div') as HTMLElement
    expect(fillBar?.style.width).toBe('0%')
  })

  it('calculates percentage with custom max value', () => {
    const { container } = render(<Progress value={135} max={300} />)
    const progressbar = screen.getByRole('progressbar')
    const fillBar = container.querySelector('[role="progressbar"] > div') as HTMLElement

    // 135 / 300 = 0.45 = 45%
    expect(fillBar?.style.width).toBe('45%')
    expect(progressbar).toHaveAttribute('aria-label', '45% complete')
  })

  it('applies custom className', () => {
    render(<Progress value={50} className="h-4 custom-class" />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveClass('h-4', 'custom-class')
  })

  it('has gradient fill styling', () => {
    const { container } = render(<Progress value={50} />)
    const fillBar = container.querySelector('[role="progressbar"] > div')
    expect(fillBar).toHaveClass('bg-gradient-to-r')
    expect(fillBar).toHaveClass('from-blue-500')
    expect(fillBar).toHaveClass('to-indigo-600')
  })

  it('has transition animation', () => {
    const { container } = render(<Progress value={50} />)
    const fillBar = container.querySelector('[role="progressbar"] > div')
    expect(fillBar).toHaveClass('transition-all')
    expect(fillBar).toHaveClass('duration-300')
    expect(fillBar).toHaveClass('ease-out')
  })

  it('forwards ref correctly', () => {
    const ref = { current: null }
    render(<Progress value={50} ref={ref as unknown as React.RefObject<HTMLDivElement>} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('renders with decimal values', () => {
    const { container } = render(<Progress value={33.33} max={100} />)
    const progressbar = screen.getByRole('progressbar')
    const fillBar = container.querySelector('[role="progressbar"] > div') as HTMLElement

    expect(fillBar?.style.width).toBe('33.33%')
    expect(progressbar).toHaveAttribute('aria-label', '33% complete') // Rounded in label
  })
})
