# ElevenLabs TTS Voice Selection Guide

Comprehensive guide for selecting and configuring ElevenLabs voices for Hebrew and English text-to-speech in educational voice interfaces.

## Quick Reference

### Recommended Hebrew Voices

| Voice Name | Voice ID | Gender | Characteristics | Best For |
|------------|----------|--------|-----------------|----------|
| **Rachel** | `21m00Tcm4TlvDq8ikWAM` | Female | Clear, neutral, professional | Educational content, tutorials |
| **Daniel** | `onwK4e9ZLuTAKqWW03F9` | Male | Deep, authoritative | Narration, formal lessons |
| **Freya** | `jsCqWAovK2LkecY7zXl4` | Female | Warm, friendly | Conversational tutoring |
| **Bella** | `EXAVITQu4vr4xnSDxMaL` | Female | Soft, calm | Accessibility, relaxed learning |

**Default recommendation**: **Rachel** - Best all-around voice for Hebrew educational content.

### Quick Setup

```python
from elevenlabs import generate, Voice, VoiceSettings

audio = generate(
    text="שלום, ברוכים הבאים לקורס",
    voice=Voice(
        voice_id="21m00Tcm4TlvDq8ikWAM",  # Rachel
        settings=VoiceSettings(
            stability=0.5,           # 0-1 (higher = more consistent)
            similarity_boost=0.75,   # 0-1 (higher = more like original)
            style=0.0,               # 0-1 (speaker style exaggeration)
            use_speaker_boost=True   # Enhance voice clarity
        )
    ),
    model="eleven_multilingual_v2"  # Required for Hebrew
)
```

## Voice Models

ElevenLabs offers multiple TTS models. For Hebrew support, use **Multilingual V2**.

### Model Comparison

| Model | Languages | Latency | Quality | Cost | Hebrew Support |
|-------|-----------|---------|---------|------|----------------|
| **Multilingual V2** | 29 (including Hebrew) | 400-900ms | Excellent | $0.30/1K chars | ✅ Yes |
| Multilingual V1 | 27 | 500-1000ms | Good | $0.30/1K chars | ✅ Yes |
| English V1 | English only | 300-600ms | Excellent | $0.30/1K chars | ❌ No |
| Turbo V2 | English + limited | 200-400ms | Good | $0.20/1K chars | ❌ No |

**Recommendation**: Use `eleven_multilingual_v2` for all LearnWithAvi voice features (supports both Hebrew and English).

## Voice Settings Explained

### 1. Stability (0.0 - 1.0)

**What it controls**: How much the voice varies across generation.

- **Low (0.0-0.3)**: More expressive, variable intonation, risk of inconsistency
- **Medium (0.4-0.6)**: Balanced expressiveness and consistency (recommended)
- **High (0.7-1.0)**: Very consistent, less expressive, robotic

**Recommendation for education**: `0.5` - Balanced consistency and natural expressiveness.

```python
# Example: High stability for consistent narration
VoiceSettings(stability=0.7)  # Good for reading long lessons

# Example: Lower stability for conversational tutoring
VoiceSettings(stability=0.3)  # More expressive, engaging
```

### 2. Similarity Boost (0.0 - 1.0)

**What it controls**: How closely the generated audio matches the original voice sample.

- **Low (0.0-0.3)**: More generic, less true to original voice
- **Medium (0.4-0.7)**: Balanced similarity
- **High (0.8-1.0)**: Very close to original, may introduce artifacts

**Recommendation for education**: `0.75` - Clear voice preservation without artifacts.

```python
# Higher similarity for branded voice consistency
VoiceSettings(similarity_boost=0.85)

# Lower similarity for more flexibility
VoiceSettings(similarity_boost=0.5)
```

### 3. Style (0.0 - 1.0)

**What it controls**: Speaker style exaggeration (pace, emotion, emphasis).

- **Low (0.0)**: Neutral, even delivery (recommended for education)
- **High (1.0)**: Exaggerated style, theatrical

**Recommendation for education**: `0.0` - Neutral, professional delivery.

```python
# Neutral style for educational content
VoiceSettings(style=0.0)  # Professional, clear

# Exaggerated style for entertainment (not recommended)
VoiceSettings(style=0.8)  # Overly dramatic
```

### 4. Speaker Boost (Boolean)

**What it controls**: Enhances voice clarity and reduces background artifacts.

- **Enabled**: Clearer voice, better for noisy text or technical content
- **Disabled**: More natural, but may have subtle artifacts

**Recommendation for education**: `True` - Always enable for clarity.

```python
VoiceSettings(use_speaker_boost=True)  # Always use this
```

## Voice Selection Guide

### By Use Case

#### 1. Tutorial Videos (Long-form content)

**Goal**: Clear, consistent narration for 10-60 minute lessons.

**Recommended voice**: Rachel (Female) or Daniel (Male)

**Settings**:
```python
VoiceSettings(
    stability=0.7,           # High consistency
    similarity_boost=0.75,
    style=0.0,               # Neutral delivery
    use_speaker_boost=True
)
```

#### 2. Conversational Tutoring (Q&A)

**Goal**: Warm, engaging responses to student questions.

**Recommended voice**: Freya (Female) or Daniel (Male)

**Settings**:
```python
VoiceSettings(
    stability=0.4,           # More expressive
    similarity_boost=0.75,
    style=0.0,
    use_speaker_boost=True
)
```

#### 3. Accessibility (Screen reader alternative)

**Goal**: Clear, slow, easy-to-understand speech.

**Recommended voice**: Bella (Female)

**Settings**:
```python
VoiceSettings(
    stability=0.8,           # Very consistent
    similarity_boost=0.7,
    style=0.0,
    use_speaker_boost=True
)
```

#### 4. Quick Announcements (Short messages)

**Goal**: Fast, clear notifications ("Quiz time!", "Lesson complete").

**Recommended voice**: Rachel (Female)

**Settings**:
```python
VoiceSettings(
    stability=0.5,
    similarity_boost=0.75,
    style=0.0,
    use_speaker_boost=True
)
```

### By Language

#### Hebrew-Only Content

**Recommended voices**:
1. **Rachel** - Best Hebrew pronunciation, natural intonation
2. **Freya** - Warm, conversational Hebrew
3. **Daniel** - Authoritative male Hebrew voice

**Model**: `eleven_multilingual_v2`

```python
audio = generate(
    text="זה שיעור על בינה מלאכותית",
    voice=Voice(voice_id="21m00Tcm4TlvDq8ikWAM"),  # Rachel
    model="eleven_multilingual_v2"
)
```

#### English-Only Content

**Recommended voices**:
- **Rachel** - Works well for English too (multilingual)
- **Bella** - Soft, clear English
- For English-only, consider ElevenLabs' native English voices (better quality)

#### Mixed Hebrew-English (Code-Switching)

**Challenge**: Technical terms in English within Hebrew sentences.

**Example**: "בואו נדבר על machine learning"

**Recommended voice**: **Rachel** (handles code-switching best)

**Model**: `eleven_multilingual_v2` (required for language mixing)

```python
# Rachel handles Hebrew-English mixing well
audio = generate(
    text="בואו נדבר על machine learning ו neural networks",
    voice=Voice(voice_id="21m00Tcm4TlvDq8ikWAM"),
    model="eleven_multilingual_v2"
)
```

**Tips**:
- Keep English terms short (1-3 words)
- Avoid full English sentences mixed with Hebrew
- Test pronunciation of technical acronyms (API, GPU, etc.)

## Advanced Features

### 1. Voice Cloning (Custom Voices)

**Use case**: Create a custom instructor voice for brand consistency.

**Requirements**:
- 1-25 minutes of audio samples
- Clear recording (no background noise)
- Consistent speaker (same person, same environment)
- Subscription: Pro plan or higher

**Process**:
1. Record 1-25 minutes of clear Hebrew speech
2. Upload to ElevenLabs voice lab
3. Train custom voice (30-60 minutes)
4. Use custom voice ID in API calls

**Cost**: Included in Pro plan ($99/month), or $330 one-time for Starter plan.

### 2. Pronunciation Dictionary

**Use case**: Fix mispronounced Hebrew technical terms or names.

**Example problem**: "API" pronounced as "אפי" instead of "A-P-I"

**Solution**: Add pronunciation rules (available in Pro plan).

```json
{
  "API": "אי פי איי",
  "GPU": "ג'י פי יו",
  "ML": "אם אל"
}
```

### 3. SSML Support (Beta)

**Use case**: Fine-grained control over speech (pauses, emphasis, rate).

**Example**:
```xml
<speak>
    <prosody rate="slow">שלום</prosody>
    <break time="500ms"/>
    <prosody rate="fast">בואו נלמד!</prosody>
</speak>
```

**Status**: Limited SSML support in ElevenLabs (pause, rate, volume). Not recommended for Hebrew.

### 4. Streaming TTS (Latency Optimization)

**Use case**: Reduce perceived latency by playing audio as it's generated.

**Example**:
```python
from elevenlabs import generate

# Streaming generator
audio_stream = generate(
    text="זהו שיעור ארוך שנרצה להפעיל בזמן אמת",
    voice=Voice(voice_id="21m00Tcm4TlvDq8ikWAM"),
    model="eleven_multilingual_v2",
    stream=True  # Enable streaming
)

# Play chunks as they arrive
for chunk in audio_stream:
    play_audio_chunk(chunk)  # Start playing immediately
```

**Latency improvement**: User hears first words in ~400ms instead of waiting for full generation (900ms).

## Browser TTS Fallback

When ElevenLabs is unavailable or too expensive, fall back to browser Web Speech API.

### Browser TTS Comparison

| Factor | Browser (Web Speech API) | ElevenLabs |
|--------|--------------------------|------------|
| **Cost** | Free | $0.30 / 1K chars |
| **Quality** | Robotic, unnatural | Natural, human-like |
| **Latency** | 0ms (instant) | 400-900ms |
| **Offline** | Yes | No |
| **Hebrew voices** | Limited (1-3 voices) | Excellent (4+ voices) |
| **Customization** | Minimal | Full control |
| **Browser support** | Chrome, Safari, Edge | All browsers (server-side) |

### Browser TTS Implementation

```typescript
// Fallback to browser TTS
function speakWithBrowser(text: string, language: string = 'he-IL') {
  if (!window.speechSynthesis) {
    console.error('Browser TTS not supported');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 1.0;   // Normal speed
  utterance.pitch = 1.0;  // Normal pitch
  utterance.volume = 1.0; // Full volume

  // Try to find a Hebrew voice
  const voices = window.speechSynthesis.getVoices();
  const hebrewVoice = voices.find(v => v.lang.startsWith('he'));
  if (hebrewVoice) {
    utterance.voice = hebrewVoice;
  }

  window.speechSynthesis.speak(utterance);
}
```

### When to Use Each

**Use ElevenLabs when**:
- High-quality voice is important (tutorials, narration)
- Budget allows ($0.03 per interaction)
- Desktop web app (latency acceptable)
- Brand consistency matters (custom voice cloning)

**Use Browser TTS when**:
- Cost is a concern (free)
- Mobile app (lower latency, works offline)
- Development/testing (instant iteration)
- Accessibility features (users may prefer familiar system voice)

**Hybrid approach** (recommended):
```typescript
async function speak(text: string, provider: 'elevenlabs' | 'browser' = 'browser') {
  if (provider === 'elevenlabs') {
    try {
      await speakWithElevenLabs(text);
    } catch (error) {
      console.warn('ElevenLabs failed, falling back to browser TTS');
      speakWithBrowser(text);
    }
  } else {
    speakWithBrowser(text);
  }
}
```

## Hebrew Pronunciation Issues

### Common Mispronunciations

| Text | Expected | ElevenLabs (Rachel) | Fix |
|------|----------|---------------------|-----|
| API | "אי פי איי" | "אפי" ❌ | Use pronunciation dictionary |
| URL | "יו אר אל" | "אורל" ❌ | Spell out: "י-ו-אר-אל" |
| ML | "אם אל" | "מל" ❌ | Spell out: "אם-אל" |
| JavaScript | "ג'אווהסקריפט" | "ג'אבאסקריפט" ✅ | Works correctly |
| React | "ריאקט" | "ריאקט" ✅ | Works correctly |

### Pronunciation Fixes

#### 1. Spell Out Acronyms

```python
# Before (mispronounced)
text = "נלמד על API ו ML"

# After (spelled out)
text = "נלמד על אי-פי-איי ו-אם-אל"
```

#### 2. Use English Text for English Terms

```python
# Mixed language approach (not recommended - inconsistent results)
text = "נלמד על <lang lang='en'>API</lang> ו-<lang lang='en'>ML</lang>"

# Better: Just use Hebrew approximations
text = "נלמד על איי-פי-איי ו-אם-אל"
```

#### 3. Add Pronunciation Guide (Pro Plan)

Upload custom pronunciation dictionary to fix persistent issues.

## Cost Optimization

### Cost Breakdown

**Pricing**: $0.30 per 1,000 characters (ElevenLabs Standard plan)

**Typical interaction costs**:
- Short answer (50 chars): $0.015
- Medium answer (200 chars): $0.06
- Long answer (500 chars): $0.15

**Monthly estimates**:
- 100 interactions/day × 150 chars avg = $67.50/month
- 500 interactions/day × 150 chars avg = $337.50/month
- 1000 interactions/day × 150 chars avg = $675/month

### Cost Reduction Strategies

#### 1. Use Browser TTS for Short Messages

```typescript
// Short notifications: Use browser TTS (free)
if (text.length < 20) {
  speakWithBrowser(text);
} else {
  // Longer responses: Use ElevenLabs (better quality)
  await speakWithElevenLabs(text);
}
```

**Savings**: ~30-50% reduction in TTS costs.

#### 2. Cache Common Responses

```typescript
// Pre-generate audio for common responses
const cachedAudio = {
  'שלום': 'data:audio/mpeg;base64,...',
  'תודה': 'data:audio/mpeg;base64,...',
  'לא הבנתי': 'data:audio/mpeg;base64,...',
};

if (cachedAudio[text]) {
  playAudio(cachedAudio[text]);  // Instant, free
} else {
  await speakWithElevenLabs(text);
}
```

**Savings**: ~10-20% reduction (common greetings/phrases).

#### 3. Truncate Long Responses

```typescript
// Limit voice responses to 500 characters max
function truncateForVoice(text: string, maxLength: number = 500): string {
  if (text.length <= maxLength) return text;

  // Truncate at sentence boundary
  const truncated = text.slice(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  return lastPeriod > 0 ? truncated.slice(0, lastPeriod + 1) : truncated + '...';
}
```

**Savings**: Prevents excessive TTS costs on long answers.

#### 4. User Preference Toggle

```typescript
// Let users choose voice quality
const userSettings = {
  voiceProvider: 'browser', // or 'elevenlabs'
  voiceEnabled: true,
};

if (userSettings.voiceEnabled) {
  if (userSettings.voiceProvider === 'elevenlabs') {
    await speakWithElevenLabs(text);
  } else {
    speakWithBrowser(text);
  }
}
```

**Savings**: Only users who value premium voice pay for it.

## Testing Voice Quality

### Subjective Evaluation (User Study)

Test script for gathering user feedback:

```typescript
const testPhrases = [
  "שלום, ברוכים הבאים לקורס על בינה מלאכותית",
  "בואו נדבר על machine learning ו neural networks",
  "האם יש לך שאלות נוספות?",
  "תודה רבה, נתראה בשיעור הבא",
];

// Play each phrase with different voices
for (const voice of ['Rachel', 'Daniel', 'Freya', 'Bella']) {
  for (const phrase of testPhrases) {
    await speakWithVoice(phrase, voice);
    const rating = await askUserRating(1-5);  // User rates quality
  }
}
```

**Metrics to collect**:
- Clarity (1-5): How clear is the pronunciation?
- Naturalness (1-5): How human-like is the voice?
- Engagement (1-5): How engaging is the voice?
- Technical accuracy (1-5): Are technical terms pronounced correctly?

### A/B Testing

Compare ElevenLabs vs. Browser TTS:

```typescript
// Randomly assign users to ElevenLabs or Browser TTS
const provider = Math.random() > 0.5 ? 'elevenlabs' : 'browser';

// Track user engagement and satisfaction
trackMetric('voice_provider', provider);
trackMetric('voice_interactions', count);
trackMetric('user_satisfaction', rating);
```

**Expected results** (based on industry benchmarks):
- **ElevenLabs**: 4.2/5 satisfaction, 2.5x higher engagement
- **Browser TTS**: 3.1/5 satisfaction, 1.0x engagement (baseline)

## Best Practices Summary

✅ **DO**:
- Use Rachel voice for Hebrew educational content (best default)
- Set `stability=0.5`, `similarity_boost=0.75` for balanced quality
- Enable `use_speaker_boost=True` always
- Use `eleven_multilingual_v2` model for Hebrew
- Test pronunciation of technical terms (API, ML, etc.)
- Implement browser TTS fallback for cost/reliability
- Truncate long responses (<500 chars for voice)

❌ **DON'T**:
- Use high `style` values (>0.2) for educational content
- Mix multiple languages in one sentence (causes instability)
- Generate audio for very long text (>1000 chars) without chunking
- Skip testing Hebrew pronunciation on real course content
- Assume all users want premium voice (offer choice)

## References

- [ElevenLabs API Documentation](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Voice Lab](https://elevenlabs.io/voice-lab)
- [Multilingual V2 Model Details](https://elevenlabs.io/docs/speech-synthesis/models)
- [Voice Settings Guide](https://elevenlabs.io/docs/speech-synthesis/voice-settings)
