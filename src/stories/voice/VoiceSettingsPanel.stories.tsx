import React, { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { type VoiceButtonMode } from '@/components/voice/VoiceButton'
import { VoiceSettingsPanel } from '@/components/voice/VoiceSettingsPanel'
import { type Language } from '@/hooks/useVoiceInput'

// ---------------------------------------------------------------------------
// Mock SpeechSynthesisVoice helpers
// ---------------------------------------------------------------------------

function makeMockVoice(name: string, lang: string): SpeechSynthesisVoice {
  return {
    name,
    lang,
    voiceURI: name,
    localService: true,
    default: false,
  } as SpeechSynthesisVoice
}

const mockEnglishVoices: SpeechSynthesisVoice[] = [
  makeMockVoice('Samantha (English)', 'en-US'),
  makeMockVoice('Alex (English)', 'en-US'),
  makeMockVoice('Victoria (English)', 'en-US'),
]

const mockHebrewVoices: SpeechSynthesisVoice[] = [
  makeMockVoice('Carmit (Hebrew)', 'he-IL'),
  makeMockVoice('Tamar (Hebrew)', 'he-IL'),
]

const allVoices = [...mockEnglishVoices, ...mockHebrewVoices]

// ---------------------------------------------------------------------------
// Interactive wrapper — lets controls actually work in the story canvas
// ---------------------------------------------------------------------------

interface DemoProps {
  initialLanguage?: Language
  initialMode?: VoiceButtonMode
  showVoices?: boolean
}

const SettingsDemo = ({
  initialLanguage = 'en-US',
  initialMode = 'toggle',
  showVoices = true,
}: DemoProps) => {
  const [language, setLanguage] = useState<Language>(initialLanguage)
  const [voiceButtonMode, setVoiceButtonMode] = useState<VoiceButtonMode>(initialMode)
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(
    mockEnglishVoices[0] ?? null
  )

  const availableVoices = showVoices ? allVoices : []

  return (
    <div
      style={{
        width: 360,
        background: '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        fontFamily: 'Rubik, system-ui, sans-serif',
      }}
    >
      <VoiceSettingsPanel
        language={language}
        onLanguageChange={setLanguage}
        availableVoices={availableVoices}
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
        hebrewVoices={mockHebrewVoices}
        englishVoices={mockEnglishVoices}
        voiceButtonMode={voiceButtonMode}
        onVoiceButtonModeChange={setVoiceButtonMode}
      />
      {/* State readout for clarity in stories */}
      <div
        style={{
          padding: '10px 16px',
          fontSize: 11,
          color: '#6b7280',
          fontFamily: 'monospace',
          borderTop: '1px solid #f3f4f6',
          background: '#f9fafb',
        }}
      >
        lang: {language} · mode: {voiceButtonMode} · voice: {selectedVoice?.name ?? 'none'}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'Voice/VoiceSettingsPanel',
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f3f4f6' },
        { name: 'dark', value: '#1b1b1b' },
      ],
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default (English, toggle mode)',
  render: () => <SettingsDemo />,
}

export const HebrewLanguage: Story = {
  name: 'Hebrew Language Selected',
  render: () => <SettingsDemo initialLanguage="he-IL" />,
}

export const PushToTalkMode: Story = {
  name: 'Push-to-Talk Mode',
  render: () => <SettingsDemo initialMode="push-to-talk" />,
}

export const AutoDetect: Story = {
  name: 'Auto-detect Language',
  render: () => <SettingsDemo initialLanguage="auto" />,
}

export const NoVoices: Story = {
  name: 'No TTS Voices Available',
  render: () => <SettingsDemo showVoices={false} />,
}

export const DarkBackground: Story = {
  name: 'On Dark Background',
  render: () => (
    <div
      style={{
        padding: 32,
        background: '#1b1b1b',
        borderRadius: 16,
        minWidth: 400,
      }}
    >
      <p
        style={{
          fontSize: 10,
          color: '#555',
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 16,
        }}
      >
        Voice Settings
      </p>
      <div style={{ borderRadius: 12, overflow: 'hidden' }}>
        <SettingsDemo />
      </div>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
}
