# Components

## Architecture

```
components/
  course/          # Course page components (chat, materials, video, chapters)
  ui/              # Reusable shadcn/ui primitives (button, card, badge, etc.)
  admin/           # Admin panel components
  voice/           # Voice chat interface (VoiceChatInterface.tsx)
  video/           # Video player components
  demo/            # Demo/showcase components
  ErrorBoundary.tsx
  LanguageSwitcher.tsx
```

## Rules

- Max 300 lines per component - extract sub-components if larger
- Single responsibility: one component, one job
- Extract complex state to custom hooks in `src/hooks/`
- Error boundaries wrap major sections (Chat, Video, Materials)
- Loading skeletons for all async data fetches
- All text must support Hebrew RTL (`dir="rtl"`, logical Tailwind props)
- New components require: unit tests + Storybook story
- Use `@/components/ui/` primitives (shadcn/ui) for base elements

## Key Components

- `course/ChatSidebar.tsx` - AI chat interface with timestamp links
- `course/MaterialsSidebar.tsx` - Course info, chapters, progress
- `course/VideoPlayerSection.tsx` - YouTube player with chapter navigation
- `course/SummaryModal.tsx` - AI-generated summary modal
- `course/LiveTranscript.tsx` - Real-time transcript sync
- `voice/VoiceChatInterface.tsx` - Push-to-talk voice AI

## Custom Hooks

Located in `src/hooks/`:
- `course/useCoursePageState.ts` - Unified course page state
- `course/useVideoControls.ts` - Video playback control
- `chat/useChatState.ts` - Chat message management
- `video/` - Video-specific hooks

## Storybook

Stories co-located as `*.stories.tsx` next to components.
