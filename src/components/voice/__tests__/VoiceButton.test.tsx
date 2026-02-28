/**
 * VoiceButton Component Tests
 *
 * Tests rendering in all button states, interaction handlers,
 * label display, and the unsupported fallback.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { type ButtonState } from '@/hooks/voice/useVoiceButtonState'
import * as useVoiceButtonStateModule from '@/hooks/voice/useVoiceButtonState'

import { VoiceButton } from '../VoiceButton'

// ─── Mock the hook ────────────────────────────────────────────────────────────

vi.mock('@/hooks/voice/useVoiceButtonState', () => ({
  useVoiceButtonState: vi.fn(),
}))

const mockHandleClick = vi.fn()
const mockHandleMouseDown = vi.fn()
const mockHandleMouseUp = vi.fn()

const defaultHookReturn = {
  buttonState: 'idle' as ButtonState,
  permissionState: 'granted' as PermissionState,
  isListening: false,
  isSupported: true,
  interimTranscript: '',
  handleClick: mockHandleClick,
  handleMouseDown: mockHandleMouseDown,
  handleMouseUp: mockHandleMouseUp,
}

const mockedHook = vi.mocked(useVoiceButtonStateModule.useVoiceButtonState)

function setHookState(overrides: Partial<typeof defaultHookReturn>) {
  mockedHook.mockReturnValue({ ...defaultHookReturn, ...overrides })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('VoiceButton', () => {
  beforeEach(() => {
    mockHandleClick.mockClear()
    mockHandleMouseDown.mockClear()
    mockHandleMouseUp.mockClear()
    mockedHook.mockReturnValue(defaultHookReturn)
  })

  describe('rendering when supported', () => {
    it('renders a button when voice is supported', () => {
      render(<VoiceButton />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders with idle state title "Voice input"', () => {
      render(<VoiceButton />)
      expect(screen.getByTitle('Voice input')).toBeInTheDocument()
    })

    it('renders with label when showLabel is true', () => {
      render(<VoiceButton showLabel />)
      expect(screen.getByText('Voice input')).toBeInTheDocument()
    })

    it('is not disabled when in idle state', () => {
      render(<VoiceButton />)
      expect(screen.getByRole('button')).toBeEnabled()
    })
  })

  describe('listening state', () => {
    beforeEach(() => setHookState({ buttonState: 'listening', isListening: true }))

    it('renders with "Listening..." title', () => {
      render(<VoiceButton />)
      expect(screen.getByTitle('Listening...')).toBeInTheDocument()
    })

    it('shows label "Listening..." when showLabel is true', () => {
      render(<VoiceButton showLabel />)
      expect(screen.getByText('Listening...')).toBeInTheDocument()
    })
  })

  describe('processing state', () => {
    beforeEach(() => setHookState({ buttonState: 'processing' }))

    it('renders with "Processing..." title', () => {
      render(<VoiceButton />)
      expect(screen.getByTitle('Processing...')).toBeInTheDocument()
    })
  })

  describe('speaking state', () => {
    beforeEach(() => setHookState({ buttonState: 'speaking' }))

    it('renders with "Speaking..." title', () => {
      render(<VoiceButton />)
      expect(screen.getByTitle('Speaking...')).toBeInTheDocument()
    })

    it('button is disabled while speaking', () => {
      render(<VoiceButton />)
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('error state', () => {
    beforeEach(() => setHookState({ buttonState: 'error' }))

    it('renders with "Error" title', () => {
      render(<VoiceButton />)
      expect(screen.getByTitle('Error')).toBeInTheDocument()
    })
  })

  describe('no-permission state', () => {
    beforeEach(() => setHookState({ buttonState: 'no-permission' }))

    it('renders with "No mic access" title', () => {
      render(<VoiceButton />)
      expect(screen.getByTitle('No mic access')).toBeInTheDocument()
    })
  })

  describe('unsupported browser', () => {
    beforeEach(() => setHookState({ isSupported: false }))

    it('renders a disabled button with unsupported message', () => {
      render(<VoiceButton />)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('title', 'Voice input not supported in this browser')
    })
  })

  describe('toggle mode interactions', () => {
    it('calls handleClick on button click', () => {
      render(<VoiceButton mode="toggle" />)
      fireEvent.click(screen.getByRole('button'))
      expect(mockHandleClick).toHaveBeenCalledOnce()
    })

    it('does not use mouseDown/mouseUp handlers in toggle mode', () => {
      render(<VoiceButton mode="toggle" />)
      fireEvent.mouseDown(screen.getByRole('button'))
      fireEvent.mouseUp(screen.getByRole('button'))
      expect(mockHandleMouseDown).not.toHaveBeenCalled()
      expect(mockHandleMouseUp).not.toHaveBeenCalled()
    })
  })

  describe('push-to-talk mode interactions', () => {
    it('calls handleMouseDown on mousedown', () => {
      render(<VoiceButton mode="push-to-talk" />)
      fireEvent.mouseDown(screen.getByRole('button'))
      expect(mockHandleMouseDown).toHaveBeenCalledOnce()
    })

    it('calls handleMouseUp on mouseup', () => {
      render(<VoiceButton mode="push-to-talk" />)
      fireEvent.mouseUp(screen.getByRole('button'))
      expect(mockHandleMouseUp).toHaveBeenCalledOnce()
    })

    it('calls handleMouseUp on mouseleave (release)', () => {
      render(<VoiceButton mode="push-to-talk" />)
      fireEvent.mouseLeave(screen.getByRole('button'))
      expect(mockHandleMouseUp).toHaveBeenCalledOnce()
    })

    it('does not call onClick in push-to-talk mode', () => {
      render(<VoiceButton mode="push-to-talk" />)
      fireEvent.click(screen.getByRole('button'))
      expect(mockHandleClick).not.toHaveBeenCalled()
    })
  })

  describe('interim transcript', () => {
    it('shows interim transcript tooltip when listening with text', () => {
      setHookState({ buttonState: 'listening', isListening: true, interimTranscript: 'שלום עולם' })
      render(<VoiceButton />)
      expect(screen.getByText('שלום עולם')).toBeInTheDocument()
    })

    it('does not show tooltip when not listening with empty transcript', () => {
      // defaultHookReturn has empty interimTranscript and buttonState=idle
      render(<VoiceButton />)
      expect(screen.queryByText('שלום עולם')).not.toBeInTheDocument()
    })
  })

  describe('push-to-talk label', () => {
    it('shows "Hold to talk" label in push-to-talk mode', () => {
      render(<VoiceButton mode="push-to-talk" showLabel />)
      expect(screen.getByText('Hold to talk')).toBeInTheDocument()
    })
  })
})
