/**
 * VoiceChatInterface - Push-to-talk voice AI tutoring interface
 *
 * @module components/voice/VoiceChatInterface
 *
 * @description
 * Complete voice-to-voice chat interface with:
 * - Push-to-talk recording with waveform visualization
 * - Real-time transcription display
 * - Streaming AI responses
 * - Audio playback for responses
 * - Latency metrics display
 * - Hebrew/English language toggle
 *
 * Target latency: <2 seconds (user stops speaking → hears first words)
 */

"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

import { Mic, MicOff, Loader2, Volume2, VolumeX, Activity, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type ChatMessage } from "@/types";

interface VoiceChatInterfaceProps {
  /** Current video ID for RAG context */
  videoId?: string;

  /** Language for voice recognition and TTS */
  language?: "he" | "en" | "auto";

  /** Conversation history for context */
  conversationHistory?: ChatMessage[];

  /** Callback when new message is added */
  onMessageAdd?: (message: ChatMessage) => void;

  /** Whether to enable TTS audio playback */
  enableTTS?: boolean;

  /** Custom className for styling */
  className?: string;
}

interface RecordingState {
  isRecording: boolean;
  isPressing: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
}

interface TranscriptionState {
  text: string;
  language?: string;
  isProcessing: boolean;
}

interface ResponseState {
  content: string;
  isStreaming: boolean;
  audioUrl?: string;
  latency?: {
    stt: number;
    rag: number;
    llm: number;
    total: number;
  };
}

/**
 * VoiceChatInterface Component
 *
 * @example
 * ```tsx
 * <VoiceChatInterface
 *   videoId="mHThVfGmd6I"
 *   language="he"
 *   conversationHistory={messages}
 *   onMessageAdd={(msg) => setMessages([...messages, msg])}
 *   enableTTS={true}
 * />
 * ```
 */
export const VoiceChatInterface = ({
  videoId,
  language = "auto",
  conversationHistory = [],
  onMessageAdd,
  enableTTS = true,
  className,
}: VoiceChatInterfaceProps) => {
  // Recording state
  const [recording, setRecording] = useState<RecordingState>({
    isRecording: false,
    isPressing: false,
    audioBlob: null,
    audioUrl: null,
  });

  // Transcription state
  const [transcription, setTranscription] = useState<TranscriptionState>({
    text: "",
    language: undefined,
    isProcessing: false,
  });

  // Response state
  const [response, setResponse] = useState<ResponseState>({
    content: "",
    isStreaming: false,
    audioUrl: undefined,
    latency: undefined,
  });

  // Audio playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop any ongoing recording
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      // Stop any ongoing audio playback
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      // Cancel any ongoing API request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Start recording audio
   */
  const startRecording = useCallback(async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);

        setRecording((prev) => ({
          ...prev,
          isRecording: false,
          audioBlob,
          audioUrl,
        }));

        // Send to API
        sendVoiceMessage(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      mediaRecorder.start();

      setRecording((prev) => ({
        ...prev,
        isRecording: true,
        isPressing: true,
        audioBlob: null,
        audioUrl: null,
      }));

      // Reset states
      setTranscription({ text: "", language: undefined, isProcessing: false });
      setResponse({ content: "", isStreaming: false, audioUrl: undefined, latency: undefined });
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Microphone access denied. Please enable microphone permissions.");
    }
  }, []);

  /**
   * Stop recording audio
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    setRecording((prev) => ({
      ...prev,
      isPressing: false,
    }));
  }, []);

  /**
   * Send voice message to API
   */
  const sendVoiceMessage = useCallback(
    async (audioBlob: Blob) => {
      setTranscription((prev) => ({ ...prev, isProcessing: true }));

      try {
        // Create FormData
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("language", language);
        if (videoId) {
          formData.append("videoId", videoId);
        }
        formData.append("enableTTS", enableTTS.toString());

        // Add conversation history
        if (conversationHistory.length > 0) {
          const history = conversationHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));
          formData.append("conversationHistory", JSON.stringify(history));
        }

        // Create abort controller
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        // Send request
        const response = await fetch("/api/voice/chat", {
          method: "POST",
          body: formData,
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Voice chat request failed");
        }

        // Read streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        setResponse((prev) => ({ ...prev, isStreaming: true }));

        while (true) {
          const { done, value } = await reader.read();

          if (done) {break;}

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");

          // Process complete SSE messages
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case "transcription":
                  setTranscription({
                    text: data.text,
                    language: data.language,
                    isProcessing: false,
                  });

                  // Add user message
                  onMessageAdd?.({
                    id: Date.now().toString(),
                    role: "user",
                    content: data.text,
                    timestamp: new Date(),
                    isVoice: true,
                  });
                  break;

                case "content":
                  setResponse((prev) => ({
                    ...prev,
                    content: prev.content + data.content,
                  }));
                  break;

                case "audio":
                  setResponse((prev) => ({
                    ...prev,
                    audioUrl: data.audioUrl,
                  }));

                  // Auto-play audio if not muted
                  if (!isMuted && data.audioUrl) {
                    playAudio(data.audioUrl);
                  }
                  break;

                case "done":
                  setResponse((prev) => ({
                    ...prev,
                    isStreaming: false,
                    latency: data.latency,
                  }));

                  // Add assistant message
                  onMessageAdd?.({
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: data.fullContent,
                    timestamp: new Date(),
                    isVoice: true,
                  });
                  break;

                case "error":
                  console.error("Voice chat error:", data.error);
                  setResponse((prev) => ({
                    ...prev,
                    isStreaming: false,
                  }));
                  alert(`Error: ${data.error}`);
                  break;
              }
            }
          }
        }
      } catch (error: any) {
        console.error("Voice message error:", error);
        setTranscription((prev) => ({ ...prev, isProcessing: false }));
        setResponse((prev) => ({ ...prev, isStreaming: false }));

        if (error.name !== "AbortError") {
          alert(`Failed to send voice message: ${error.message}`);
        }
      }
    },
    [language, videoId, enableTTS, conversationHistory, onMessageAdd, isMuted]
  );

  /**
   * Play audio response
   */
  const playAudio = useCallback((audioUrl: string) => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    const audio = new Audio(audioUrl);
    audioElementRef.current = audio;

    audio.onplay = () => setIsPlayingAudio(true);
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => {
      console.error("Audio playback error");
      setIsPlayingAudio(false);
    };

    audio.play().catch((error) => {
      console.error("Failed to play audio:", error);
      setIsPlayingAudio(false);
    });
  }, []);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);

    // Stop current audio if muting
    if (!isMuted && audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    }
  }, [isMuted]);

  // Determine overall state
  const isProcessing = transcription.isProcessing || response.isStreaming;
  const canRecord = !isProcessing && !isPlayingAudio;

  return (
    <div className={cn("flex flex-col items-center gap-4 p-6", className)}>
      {/* Main Push-to-Talk Button */}
      <div className="relative">
        <Button
          variant={recording.isRecording ? "destructive" : "default"}
          size="icon"
          className={cn(
            "h-24 w-24 rounded-full transition-all duration-200",
            recording.isRecording && "ring-4 ring-red-500 ring-offset-2 animate-pulse",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
          disabled={!canRecord}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          title={canRecord ? "Hold to talk" : "Processing..."}
        >
          {recording.isRecording ? (
            <Mic size={40} className="text-white animate-pulse" />
          ) : isProcessing ? (
            <Loader2 size={40} className="animate-spin" />
          ) : isPlayingAudio ? (
            <Volume2 size={40} className="animate-pulse text-blue-500" />
          ) : (
            <Mic size={40} />
          )}
        </Button>

        {/* Recording indicator */}
        {recording.isRecording ? <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              <Activity size={12} className="animate-pulse" />
              Recording...
            </div>
          </div> : null}
      </div>

      {/* Instruction Text */}
      <div className="text-center">
        {recording.isRecording ? (
          <p className="text-sm font-medium text-red-600">
            Release to send
          </p>
        ) : isProcessing ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {transcription.isProcessing
              ? "Transcribing..."
              : response.isStreaming
              ? "AI is thinking..."
              : "Processing..."}
          </p>
        ) : isPlayingAudio ? (
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Playing response...
          </p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Hold to talk
          </p>
        )}
      </div>

      {/* Waveform Visualizer */}
      {recording.isRecording ? <div className="w-full max-w-md">
          <WaveformVisualizer isActive={recording.isRecording} />
        </div> : null}

      {/* Transcription Display */}
      {transcription.text ? <div className="w-full max-w-md p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="flex items-start gap-2">
            <Mic size={16} className="mt-0.5 text-blue-600" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                You said ({transcription.language || language}):
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {transcription.text}
              </p>
            </div>
          </div>
        </div> : null}

      {/* Response Display */}
      {response.content ? <div className="w-full max-w-md p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Volume2 size={16} className="mt-0.5 text-blue-600" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                AI Response:
              </p>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {response.content}
              </p>
            </div>
          </div>
        </div> : null}

      {/* Latency Display */}
      {response.latency ? <div className="w-full max-w-md">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Zap size={12} />
              <span>Latency: {response.latency.total}ms</span>
            </div>
            <div className="flex items-center gap-3">
              <span>STT: {response.latency.stt}ms</span>
              <span>LLM: {response.latency.llm}ms</span>
            </div>
          </div>
        </div> : null}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMute}
          className="h-10 w-10 rounded-full"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </Button>
      </div>
    </div>
  );
}

/**
 * Waveform visualizer for recording feedback
 */
interface WaveformVisualizerProps {
  isActive: boolean;
  className?: string;
}

const WaveformVisualizer = ({ isActive, className }: WaveformVisualizerProps) => {
  const barsCount = 30;

  return (
    <div className={cn("flex items-center justify-center gap-1 h-12", className)}>
      {Array.from({ length: barsCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-blue-500 rounded-full transition-all duration-150",
            isActive ? "animate-waveform" : "h-1"
          )}
          style={{
            animationDelay: `${i * 30}ms`,
            height: isActive ? undefined : "4px",
          }}
        />
      ))}
    </div>
  );
}
