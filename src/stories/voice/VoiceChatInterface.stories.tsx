/**
 * VoiceChatInterface stories
 *
 * VoiceChatInterface uses browser media APIs (MediaRecorder, fetch/SSE) internally
 * via its hooks (useMicrophone, useAudioRecorder, useVoiceAPI, useAudioPlayback).
 * Those APIs are unavailable in the Storybook/jsdom environment, so each story
 * renders a visual mockup composed from the same sub-components (MicrophoneButton,
 * WaveformVisualizer) in a layout that matches the real interface.
 *
 * This is the correct Storybook pattern for components with browser side-effects.
 */

import React from 'react'

import type { Meta, StoryObj } from '@storybook/react'
import { Mic, Volume2, Zap, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { MicrophoneButton } from '@/components/voice/MicrophoneButton'
import { WaveformVisualizer } from '@/components/voice/WaveformVisualizer'

// ---------------------------------------------------------------------------
// Shared layout wrapper — mirrors VoiceChatInterface's outer div
// ---------------------------------------------------------------------------

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      width: 400,
      background: '#ffffff',
      borderRadius: 16,
      border: '1px solid #e5e7eb',
      fontFamily: 'Rubik, system-ui, sans-serif',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
    }}
  >
    {children}
  </div>
)

// ---------------------------------------------------------------------------
// State-specific sub-components
// ---------------------------------------------------------------------------

const IdleContent = () => (
  <>
    <MicrophoneButton state="idle" />
    <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Hold to talk</p>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" aria-label="Mute audio">
        <Volume2 size={18} />
      </Button>
    </div>
  </>
)

const RecordingContent = () => (
  <>
    <MicrophoneButton state="recording" />
    <p style={{ fontSize: 14, color: '#dc2626', fontWeight: 500, margin: 0 }}>Release to send</p>
    <div style={{ width: '100%' }}>
      <WaveformVisualizer isActive barCount={30} />
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" aria-label="Mute audio">
        <Volume2 size={18} />
      </Button>
    </div>
  </>
)

const ProcessingContent = () => (
  <>
    <MicrophoneButton state="processing" disabled />
    <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Transcribing...</p>
    {/* Transcription result */}
    <div
      style={{
        width: '100%',
        padding: '12px 16px',
        background: '#f3f4f6',
        borderRadius: 8,
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
      }}
    >
      <Mic size={16} style={{ color: '#3b82f6', marginTop: 2, flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 4px' }}>You said (en):</p>
        <p style={{ fontSize: 14, color: '#111827', margin: 0 }}>
          What is the difference between props and state?
        </p>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" aria-label="Mute audio">
        <Volume2 size={18} />
      </Button>
    </div>
  </>
)

const PlayingContent = () => (
  <>
    <MicrophoneButton state="playing" disabled />
    <p style={{ fontSize: 14, color: '#3b82f6', margin: 0 }}>Playing response...</p>
    {/* Transcription */}
    <div
      style={{
        width: '100%',
        padding: '12px 16px',
        background: '#f3f4f6',
        borderRadius: 8,
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
      }}
    >
      <Mic size={16} style={{ color: '#3b82f6', marginTop: 2, flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 4px' }}>You said (en):</p>
        <p style={{ fontSize: 14, color: '#111827', margin: 0 }}>
          What is the difference between props and state?
        </p>
      </div>
    </div>
    {/* AI Response */}
    <div
      style={{
        width: '100%',
        padding: '12px 16px',
        background: '#eff6ff',
        borderRadius: 8,
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
      }}
    >
      <Volume2 size={16} style={{ color: '#3b82f6', marginTop: 2, flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 4px' }}>AI Response:</p>
        <p style={{ fontSize: 14, color: '#111827', margin: 0 }}>
          Props are passed from parent to child and are read-only. State is internal to a component
          and can change over time, triggering re-renders.
        </p>
      </div>
    </div>
    {/* Latency */}
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Zap size={12} /> Latency: 1240ms
        </span>
        <span style={{ display: 'flex', gap: 12 }}>
          <span>STT: 340ms</span>
          <span>LLM: 900ms</span>
        </span>
      </div>
    </div>
    {/* Controls */}
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" aria-label="Mute audio">
        <Volume2 size={18} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-10 gap-1.5 rounded-full px-3 text-xs"
        style={{ color: '#9ca3af' }}
        aria-label="Clear voice conversation history"
      >
        <Trash2 size={14} />
        Clear history
      </Button>
    </div>
  </>
)

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'Voice/VoiceChatInterface',
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f3f4f6' },
        { name: 'dark', value: '#1b1b1b' },
      ],
    },
    docs: {
      description: {
        component:
          'Push-to-talk voice AI tutoring interface. Stories show visual states using real sub-components (MicrophoneButton, WaveformVisualizer). The full component uses browser media APIs that are unavailable in Storybook.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

// ---------------------------------------------------------------------------
// Stories — one per interface state
// ---------------------------------------------------------------------------

export const IdleState: Story = {
  name: 'Idle — ready to record',
  render: () => (
    <Wrapper>
      <IdleContent />
    </Wrapper>
  ),
}

export const RecordingState: Story = {
  name: 'Recording — user is speaking',
  render: () => (
    <Wrapper>
      <RecordingContent />
    </Wrapper>
  ),
}

export const ProcessingState: Story = {
  name: 'Processing — transcribing audio',
  render: () => (
    <Wrapper>
      <ProcessingContent />
    </Wrapper>
  ),
}

export const PlayingState: Story = {
  name: 'Playing — AI response audio',
  render: () => (
    <Wrapper>
      <PlayingContent />
    </Wrapper>
  ),
}

export const AllStates: Story = {
  name: 'All States — side by side',
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: 24,
        padding: 40,
        background: '#f3f4f6',
        borderRadius: 16,
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'center',
        fontFamily: 'Rubik, system-ui, sans-serif',
      }}
    >
      {(
        [
          { label: 'idle', Content: IdleContent },
          { label: 'recording', Content: RecordingContent },
          { label: 'processing', Content: ProcessingContent },
          { label: 'playing', Content: PlayingContent },
        ] as const
      ).map(({ label, Content }) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p
            style={{
              fontSize: 10,
              color: '#9ca3af',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              textAlign: 'center',
              margin: 0,
            }}
          >
            {label}
          </p>
          <Wrapper>
            <Content />
          </Wrapper>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'fullscreen' },
}
