import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import type { SummaryData } from '@/types'

import { SummaryModal } from '../SummaryModal'

const mockSummaryData: SummaryData = {
  about: 'בסרטון הזה נלמד על AI',
  tools: [
    {
      name: 'ChatGPT',
      desc: 'מודל שפה',
      color: 'bg-emerald-100 text-emerald-700',
    },
    {
      name: 'Make',
      desc: 'אוטומציה',
      color: 'bg-purple-100 text-purple-700',
    },
  ],
  process: [
    {
      step: 1,
      title: 'שלב 1',
      desc: 'תיאור שלב 1',
    },
    {
      step: 2,
      title: 'שלב 2',
      desc: 'תיאור שלב 2',
    },
  ],
  benefits: ['יתרון 1', 'יתרון 2', 'יתרון 3'],
}

describe('SummaryModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <SummaryModal
        isOpen={false}
        onClose={() => {}}
        isGenerating={false}
        summaryData={null}
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders when isOpen is true', () => {
    render(
      <SummaryModal
        isOpen
        onClose={() => {}}
        isGenerating={false}
        summaryData={mockSummaryData}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('displays video title when provided', () => {
    render(
      <SummaryModal
        isOpen
        onClose={() => {}}
        videoTitle="Test Video Title"
        isGenerating={false}
        summaryData={mockSummaryData}
      />
    )

    expect(screen.getByText('Test Video Title')).toBeInTheDocument()
  })

  it('displays loading state when isGenerating is true', () => {
    render(
      <SummaryModal
        isOpen
        onClose={() => {}}
        isGenerating
        summaryData={null}
      />
    )

    expect(screen.getByText('מנתח את התמליל...')).toBeInTheDocument()
    expect(screen.getByText('ה-AI קורא את התמליל ומייצר סיכום מותאם אישית')).toBeInTheDocument()
  })

  it('displays summary data when provided', () => {
    render(
      <SummaryModal
        isOpen
        onClose={() => {}}
        isGenerating={false}
        summaryData={mockSummaryData}
      />
    )

    // Check about section
    expect(screen.getByText('בסרטון הזה נלמד על AI')).toBeInTheDocument()

    // Check tools
    expect(screen.getByText('ChatGPT')).toBeInTheDocument()
    expect(screen.getByText('Make')).toBeInTheDocument()

    // Check process steps
    expect(screen.getByText('שלב 1')).toBeInTheDocument()
    expect(screen.getByText('שלב 2')).toBeInTheDocument()

    // Check benefits
    expect(screen.getByText('יתרון 1')).toBeInTheDocument()
    expect(screen.getByText('יתרון 2')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn()
    render(
      <SummaryModal
        isOpen
        onClose={handleClose}
        isGenerating={false}
        summaryData={mockSummaryData}
      />
    )

    const closeButton = screen.getByRole('button', { name: /close summary modal/i })
    fireEvent.click(closeButton)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', () => {
    const handleClose = vi.fn()
    render(
      <SummaryModal
        isOpen
        onClose={handleClose}
        isGenerating={false}
        summaryData={mockSummaryData}
      />
    )

    const backdrop = screen.getByRole('dialog')
    fireEvent.click(backdrop)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when modal content is clicked', () => {
    const handleClose = vi.fn()
    render(
      <SummaryModal
        isOpen
        onClose={handleClose}
        isGenerating={false}
        summaryData={mockSummaryData}
      />
    )

    const modalContent = screen.getByText('סיכום AI מהתמליל').closest('div')
    if (modalContent) {
      fireEvent.click(modalContent)
    }

    expect(handleClose).not.toHaveBeenCalled()
  })

  it('calls onClose when ESC key is pressed', () => {
    const handleClose = vi.fn()
    render(
      <SummaryModal
        isOpen
        onClose={handleClose}
        isGenerating={false}
        summaryData={mockSummaryData}
      />
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when other keys are pressed', () => {
    const handleClose = vi.fn()
    render(
      <SummaryModal
        isOpen
        onClose={handleClose}
        isGenerating={false}
        summaryData={mockSummaryData}
      />
    )

    fireEvent.keyDown(document, { key: 'Enter' })
    fireEvent.keyDown(document, { key: 'a' })

    expect(handleClose).not.toHaveBeenCalled()
  })

  it('prevents body scroll when open', () => {
    const { unmount } = render(
      <SummaryModal
        isOpen
        onClose={() => {}}
        isGenerating={false}
        summaryData={mockSummaryData}
      />
    )

    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('unset')
  })

  it('has correct ARIA attributes', () => {
    render(
      <SummaryModal
        isOpen
        onClose={() => {}}
        isGenerating={false}
        summaryData={mockSummaryData}
      />
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'summary-modal-title')
  })

  it('displays copy button', () => {
    render(
      <SummaryModal
        isOpen
        onClose={() => {}}
        isGenerating={false}
        summaryData={mockSummaryData}
      />
    )

    const copyButton = screen.getByRole('button', { name: /העתק סיכום/i })
    expect(copyButton).toBeInTheDocument()
    expect(copyButton).not.toBeDisabled()
  })

  it('disables copy button when isGenerating', () => {
    render(
      <SummaryModal
        isOpen
        onClose={() => {}}
        isGenerating
        summaryData={null}
      />
    )

    const copyButton = screen.getByRole('button', { name: /העתק סיכום/i })
    expect(copyButton).toBeDisabled()
  })

  it('disables copy button when no summaryData', () => {
    render(
      <SummaryModal
        isOpen
        onClose={() => {}}
        isGenerating={false}
        summaryData={null}
      />
    )

    const copyButton = screen.getByRole('button', { name: /העתק סיכום/i })
    expect(copyButton).toBeDisabled()
  })

  it('copies summary to clipboard when copy button clicked', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })

    render(
      <SummaryModal
        isOpen
        onClose={() => {}}
        videoTitle="Test Video"
        isGenerating={false}
        summaryData={mockSummaryData}
      />
    )

    const copyButton = screen.getByRole('button', { name: /העתק סיכום/i })
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('סיכום הסרטון: Test Video')
      )
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('בסרטון הזה נלמד על AI')
      )
    })
  })

  it('displays close button in footer', () => {
    render(
      <SummaryModal
        isOpen
        onClose={() => {}}
        isGenerating={false}
        summaryData={mockSummaryData}
      />
    )

    const closeButtons = screen.getAllByRole('button', { name: /סגור/i })
    expect(closeButtons.length).toBeGreaterThan(0)
  })

  it('renders with RTL text direction', () => {
    render(
      <SummaryModal
        isOpen
        onClose={() => {}}
        isGenerating={false}
        summaryData={mockSummaryData}
      />
    )

    const rtlElements = screen.getAllByText(/על מה הסרטון/i)
    rtlElements.forEach((element) => {
      const parent = element.closest('[dir="rtl"]')
      expect(parent).toBeInTheDocument()
    })
  })
})
