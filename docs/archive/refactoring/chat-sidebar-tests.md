# ChatSidebar Component - Testing Plan

## Manual Testing Checklist

### 1. Component Rendering
- [ ] ChatSidebar renders on desktop (lg breakpoint)
- [ ] ChatSidebar hidden on mobile/tablet
- [ ] Header displays with AI Assistant branding
- [ ] Waveform animation plays smoothly
- [ ] Connected status shows with pulse indicator

### 2. Message Display
- [ ] Welcome message appears on load
- [ ] User messages align to right (RTL)
- [ ] Assistant messages align to left
- [ ] Hebrew text displays correctly (RTL)
- [ ] Message bubbles have correct colors (blue for user, gray for assistant)

### 3. Timestamp Parsing
- [ ] Format `[timestamp:3:45]` renders as clickable link
- [ ] Format `[timestamp:0:30]` renders as clickable link
- [ ] Clicking timestamp seeks video to correct time
- [ ] Multiple timestamps in one message all work
- [ ] Non-timestamp text displays normally

### 4. Streaming Messages
- [ ] Empty assistant message appears immediately when loading
- [ ] Content updates character by character during stream
- [ ] Final message shows with all content
- [ ] Sources array populates if provided
- [ ] No flickering during updates

### 5. Input Field
- [ ] Input accepts Hebrew text (RTL)
- [ ] Input accepts English text
- [ ] Placeholder shows in Hebrew
- [ ] Input clears after sending message
- [ ] Enter key sends message (without Shift)
- [ ] Shift+Enter adds new line

### 6. Voice Button
- [ ] Mic icon shows when not listening
- [ ] MicOff icon shows when listening
- [ ] Background changes to red when listening
- [ ] Click toggles listening state
- [ ] ARIA label updates based on state

### 7. Send Button
- [ ] Disabled when input is empty
- [ ] Disabled when loading
- [ ] Enabled when input has text
- [ ] Shows Send icon (paper plane)
- [ ] Click sends message

### 8. Loading State
- [ ] Spinner appears when isLoading is true
- [ ] Spinner disappears when isLoading is false
- [ ] Input disabled during loading
- [ ] Send button disabled during loading

### 9. ScrollArea
- [ ] Messages scroll smoothly
- [ ] Auto-scrolls to bottom on new message
- [ ] Scrollbar appears when content overflows
- [ ] ScrollArea takes full available height

### 10. Accessibility
- [ ] All buttons have ARIA labels
- [ ] Input has proper placeholder
- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] Focus indicators visible

## Component Integration Tests

### Test 1: Full Chat Flow
```typescript
// User types message → Send → Receive response with timestamp → Click timestamp

1. Type "מה זה Make?" in input
2. Click Send button
3. Verify message appears in chat
4. Wait for streaming response
5. Response contains: "...ב-Make כדי לחבר..."
6. Response contains clickable timestamp
7. Click timestamp
8. Verify video seeks to that time
```

### Test 2: Voice Input Flow
```typescript
// Toggle voice → Transcription updates → Send

1. Click Mic button
2. Verify button turns red
3. Verify icon changes to MicOff
4. Speak in Hebrew
5. Input updates with transcription
6. Click Mic again to stop
7. Click Send
8. Verify message sent correctly
```

### Test 3: Multiple Messages
```typescript
// Send several messages rapidly

1. Send message "שאלה 1"
2. Wait for response
3. Send message "שאלה 2"
4. Wait for response
5. Send message "שאלה 3"
6. Verify all messages display in order
7. Verify ScrollArea auto-scrolled
```

### Test 4: Empty State
```typescript
// Try to send empty message

1. Clear input field
2. Click Send button
3. Verify button is disabled
4. Type single space
5. Verify button still disabled
6. Type actual text
7. Verify button enabled
```

### Test 5: Timestamp Edge Cases
```typescript
// Test various timestamp formats

Test messages:
- "רגע [timestamp:0:00]" → should parse
- "ב[timestamp:1:30] מסביר" → should parse
- "[timestamp:10:59]" → should parse
- "timestamp:2:30" → should NOT parse (missing brackets)
- "[timestamp:5:5]" → should parse as 5:05
```

## Browser Testing

### Desktop
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile (Hidden but verify CSS)
- [ ] iOS Safari
- [ ] Chrome Mobile
- [ ] Firefox Mobile

## Performance Testing

### Metrics
- [ ] Initial render < 100ms
- [ ] Message add < 50ms
- [ ] Timestamp click response < 100ms
- [ ] Streaming update < 16ms per frame (60fps)
- [ ] No memory leaks after 100 messages

### Load Testing
- [ ] 10 messages - smooth
- [ ] 50 messages - smooth with ScrollArea
- [ ] 100 messages - still performant
- [ ] 500 messages - consider virtualization

## Error Handling

### Test Scenarios
- [ ] Network error during streaming
- [ ] Invalid timestamp format
- [ ] Missing onTimestampClick handler
- [ ] Empty messages array
- [ ] Null/undefined props

## Regression Testing

### After Changes
- [ ] Run full test suite
- [ ] Verify TypeScript compilation
- [ ] Verify build succeeds
- [ ] Check bundle size impact
- [ ] Test in dev and production modes

## Automated Tests (Future)

```typescript
// Example Jest/RTL test
describe('ChatMessage', () => {
  it('parses timestamps correctly', () => {
    const onTimestampClick = jest.fn();
    const message = {
      id: '1',
      role: 'assistant' as const,
      content: 'Check [timestamp:3:45] for details',
      timestamp: new Date(),
    };
    
    render(
      <ChatMessage message={message} onTimestampClick={onTimestampClick} />
    );
    
    const timestampButton = screen.getByText('3:45');
    fireEvent.click(timestampButton);
    
    expect(onTimestampClick).toHaveBeenCalledWith(225); // 3*60 + 45
  });
});
```

## Known Limitations

1. **No Message Persistence**: Messages reset on page refresh
2. **No Edit/Delete**: Can't modify sent messages
3. **No Message Search**: Can't search through chat history
4. **No Export**: Can't export conversation
5. **Single Chat Session**: No conversation history management

## Future Enhancements

1. **Message Actions**
   - Copy message text
   - Regenerate response
   - Rate response quality

2. **Rich Media**
   - Inline images from video
   - Code snippets with syntax highlighting
   - Markdown formatting

3. **Context Menu**
   - Right-click on messages
   - Copy, delete, quote options

4. **Typing Indicator**
   - Show "AI is typing..." animation
   - Estimated response time

5. **Message Reactions**
   - Thumbs up/down
   - Save to favorites
   - Report issues

---

**Test Coverage Target:** 90%+
**Priority:** P0 (Critical Path)
**Status:** Ready for Testing
