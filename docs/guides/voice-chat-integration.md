# Voice Chat Integration Guide

Quick guide to add Voice AI Chat to the course page.

## Option 1: Add to Existing Chat Sidebar (Recommended)

### Step 1: Update ChatInput Component

Edit `src/components/course/ChatInput.tsx`:

```tsx
import { useState } from "react";
import { Send, Mic, MicOff, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceChatInterface } from "@/components/voice";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  isLoading: boolean;
  isListening: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onToggleVoice: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  videoId?: string; // Add this
  conversationHistory?: any[]; // Add this
  onMessageAdd?: (msg: any) => void; // Add this
}

export function ChatInput({
  value,
  isLoading,
  isListening,
  onChange,
  onSend,
  onToggleVoice,
  onKeyPress,
  videoId,
  conversationHistory,
  onMessageAdd,
}: ChatInputProps) {
  const [inputMode, setInputMode] = useState<"text" | "voice" | "voice-chat">("text");

  return (
    <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-gray-900">
      {/* Mode Toggle */}
      <div className="flex items-center gap-1 mb-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
        <button
          onClick={() => setInputMode("text")}
          className={cn(
            "px-2 py-1 rounded text-xs transition-colors flex-1",
            inputMode === "text"
              ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
              : "text-gray-600 dark:text-gray-400"
          )}
        >
          Text
        </button>
        <button
          onClick={() => setInputMode("voice")}
          className={cn(
            "px-2 py-1 rounded text-xs transition-colors flex-1",
            inputMode === "voice"
              ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
              : "text-gray-600 dark:text-gray-400"
          )}
        >
          Voice
        </button>
        <button
          onClick={() => setInputMode("voice-chat")}
          className={cn(
            "px-2 py-1 rounded text-xs transition-colors flex-1",
            inputMode === "voice-chat"
              ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
              : "text-gray-600 dark:text-gray-400"
          )}
        >
          AI Voice
        </button>
      </div>

      {/* Input Area */}
      {inputMode === "voice-chat" ? (
        <VoiceChatInterface
          videoId={videoId}
          language="he"
          conversationHistory={conversationHistory}
          onMessageAdd={onMessageAdd}
          enableTTS={true}
        />
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder="שאל שאלה על הסרטון..."
              className="w-full px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="rtl"
              aria-label="Chat input"
            />
          </div>

          {inputMode === "voice" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleVoice}
              className={cn(
                "rounded-full",
                isListening && "bg-red-100 dark:bg-red-900/30 text-red-600"
              )}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          )}

          <Button
            onClick={onSend}
            disabled={!value.trim() || isLoading}
            size="icon"
            className="rounded-full bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
```

### Step 2: Update ChatSidebar

Edit `src/components/course/ChatSidebar.tsx`:

```tsx
export interface ChatSidebarProps {
  messages: ChatMessage[];
  inputMessage: string;
  isLoading: boolean;
  isListening: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onToggleVoice: () => void;
  onTimestampClick: (time: number) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  videoId?: string; // Add this
  onMessageAdd?: (msg: ChatMessage) => void; // Add this
}

export function ChatSidebar({
  messages,
  inputMessage,
  isLoading,
  isListening,
  onInputChange,
  onSendMessage,
  onToggleVoice,
  onTimestampClick,
  onKeyPress,
  videoId, // Add this
  onMessageAdd, // Add this
}: ChatSidebarProps) {
  return (
    <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hidden lg:flex flex-col h-[calc(100vh-57px)] overflow-hidden">
      <ChatHeader />

      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        onTimestampClick={onTimestampClick}
      />

      <ChatInput
        value={inputMessage}
        isLoading={isLoading}
        isListening={isListening}
        onChange={onInputChange}
        onSend={onSendMessage}
        onToggleVoice={onToggleVoice}
        onKeyPress={onKeyPress}
        videoId={videoId} // Add this
        conversationHistory={messages} // Add this
        onMessageAdd={onMessageAdd} // Add this
      />
    </div>
  );
}
```

### Step 3: Update CoursePageClient

Edit `src/app/course/[courseId]/CoursePageClient.tsx`:

```tsx
// In the ChatSidebar section
<ChatSidebar
  messages={state.chat.messages}
  inputMessage={state.chat.inputMessage}
  isLoading={state.chat.isLoading}
  isListening={state.chat.isListening}
  onInputChange={state.chat.setInputMessage}
  onSendMessage={state.chat.handleSendMessage}
  onToggleVoice={state.chat.toggleVoiceInput}
  onTimestampClick={state.video.handleSeek}
  onKeyPress={state.chat.handleKeyPress}
  videoId={state.currentVideo?.youtubeId} // Add this
  onMessageAdd={(msg) => {
    // Add to messages state
    state.chat.messages.push(msg);
  }}
/>
```

### Step 4: Update useChatState Hook

Edit `src/hooks/chat/useChatState.ts` (or wherever chat state is managed):

```tsx
// Add handler for voice messages
const handleVoiceMessage = useCallback((message: ChatMessage) => {
  setMessages(prev => [...prev, message]);
}, []);

return {
  // ... existing state
  handleVoiceMessage,
};
```

## Option 2: Add as Floating Button (Alternative)

### Add Floating Voice Chat Button

Edit `src/app/course/[courseId]/CoursePageClient.tsx`:

```tsx
import { useState } from "react";
import { Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceChatInterface } from "@/components/voice";

export default function CoursePageClient({ course, courseId }: CoursePageClientProps) {
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const state = useCoursePageState(course, courseId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ... existing layout ... */}

      {/* Floating Voice Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          onClick={() => setShowVoiceChat(!showVoiceChat)}
          className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
        >
          <Headphones size={24} />
        </Button>
      </div>

      {/* Voice Chat Modal */}
      {showVoiceChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold">Voice Chat</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowVoiceChat(false)}
              >
                <X size={20} />
              </Button>
            </div>
            <VoiceChatInterface
              videoId={state.currentVideo?.youtubeId}
              language="he"
              conversationHistory={state.chat.messages}
              onMessageAdd={(msg) => {
                state.chat.messages.push(msg);
              }}
              enableTTS={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

## Testing

### 1. Check Environment Variables

```bash
# .env.local
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...  # Optional
```

### 2. Test Voice Chat API

```bash
curl -X GET http://localhost:3000/api/voice/chat
# Should return: {"status":"ok","services":{...}}
```

### 3. Test in Browser

1. Start dev server: `npm run dev`
2. Navigate to a course page
3. Click "AI Voice" tab in chat
4. Hold microphone button and speak
5. Verify transcription and response appear

### 4. Common Issues

**"Microphone access denied"**
- Allow microphone in browser settings
- Ensure HTTPS in production (localhost OK in dev)

**"Voice chat API is not available"**
- Check `OPENAI_API_KEY` is set
- Check `ANTHROPIC_API_KEY` is set
- Restart dev server

**High latency (>2s)**
- Check network connection
- Verify API keys are valid
- Check rate limiting (5 req/min)

## Next Steps

1. ✅ Choose integration option (Option 1 recommended)
2. ✅ Update component files as shown above
3. ✅ Test with Hebrew and English audio
4. ✅ Monitor latency metrics
5. ✅ Gather user feedback
6. ✅ Add analytics tracking

## Support

For issues or questions:
- Voice AI Tutor skill: `skills/voice-ai-tutor/SKILL.md`
- Implementation guide: `VOICE_AI_TUTOR_IMPLEMENTATION.md`
- Component docs: Inline TSDoc comments
