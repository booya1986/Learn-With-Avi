'use client'

import React from 'react'

import { ChevronDown } from 'lucide-react'

import { type Language } from '@/hooks/useVoiceInput'
import { cn } from '@/lib/utils'

import { type VoiceButtonMode } from './VoiceButton'

interface VoiceSettingsPanelProps {
  language: Language
  onLanguageChange: (language: Language) => void
  availableVoices: SpeechSynthesisVoice[]
  selectedVoice: SpeechSynthesisVoice | null
  onVoiceChange: (voice: SpeechSynthesisVoice) => void
  hebrewVoices: SpeechSynthesisVoice[]
  englishVoices: SpeechSynthesisVoice[]
  voiceButtonMode: VoiceButtonMode
  onVoiceButtonModeChange: (mode: VoiceButtonMode) => void
}

export const VoiceSettingsPanel = ({
  language,
  onLanguageChange,
  availableVoices,
  selectedVoice,
  onVoiceChange,
  hebrewVoices,
  englishVoices,
  voiceButtonMode,
  onVoiceButtonModeChange,
}: VoiceSettingsPanelProps) => {
  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="space-y-3">
        {/* Language Selection */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Language</span>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 pe-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="auto">Auto-detect</option>
              <option value="en-US">English</option>
              <option value="he-IL">Hebrew</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>
        </div>

        {/* Voice Selection */}
        {availableVoices.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Voice</span>
            <div className="relative">
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const voice = availableVoices.find((v) => v.name === e.target.value)
                  if (voice) {onVoiceChange(voice)}
                }}
                className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 pe-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[180px] truncate"
              >
                {(language === 'he-IL' ? hebrewVoices : englishVoices).map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
            </div>
          </div>
        )}

        {/* Voice Button Mode */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Input Mode</span>
          <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 p-0.5">
            <button
              onClick={() => onVoiceButtonModeChange('toggle')}
              className={cn(
                'px-2 py-1 rounded text-xs transition-colors',
                voiceButtonMode === 'toggle'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              Toggle
            </button>
            <button
              onClick={() => onVoiceButtonModeChange('push-to-talk')}
              className={cn(
                'px-2 py-1 rounded text-xs transition-colors',
                voiceButtonMode === 'push-to-talk'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              Push-to-talk
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
