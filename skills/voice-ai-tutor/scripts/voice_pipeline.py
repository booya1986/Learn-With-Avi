#!/usr/bin/env python3
"""
Voice AI Tutor Pipeline

Complete voice-to-voice pipeline: STT (Whisper) → LLM (Claude) → TTS (ElevenLabs)
Optimized for sub-2s latency with Hebrew language support.

Usage:
    python voice_pipeline.py --audio-file question.wav --language he --video-id VIDEO_ID
    python voice_pipeline.py --audio-file question.wav --stream --output-audio response.mp3
"""

import argparse
import asyncio
import json
import os
import sys
import time
from pathlib import Path
from typing import Optional, AsyncGenerator, List, Dict

import anthropic
import openai
from elevenlabs import generate, Voice, VoiceSettings

# Configuration
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

# Voice settings
DEFAULT_HEBREW_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel
DEFAULT_ENGLISH_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel (multilingual)

# System prompt for voice tutor
VOICE_TUTOR_PROMPT = """You are a voice AI tutor for LearnWithAvi educational platform.

CRITICAL RULES FOR VOICE RESPONSES:
1. Keep responses CONCISE (2-4 sentences max) - users are listening, not reading
2. Use SIMPLE language - avoid complex terms unless explaining them
3. Be CONVERSATIONAL - use natural speech patterns ("Let's see...", "So...", "Well...")
4. Provide ACTIONABLE answers - users want quick, clear explanations
5. If the answer isn't in the context, say: "I don't have that information in the current lesson."

When responding in Hebrew:
- Use natural Hebrew speech patterns
- Avoid overly formal language
- Keep sentences short and clear

Remember: Users are in voice mode for speed. Be helpful, clear, and brief."""


class VoicePipelineMetrics:
    """Track latency metrics for voice pipeline."""

    def __init__(self):
        self.stt_start = 0
        self.stt_end = 0
        self.rag_start = 0
        self.rag_end = 0
        self.llm_start = 0
        self.llm_first_token = 0
        self.llm_end = 0
        self.tts_start = 0
        self.tts_end = 0

    def report(self) -> Dict[str, float]:
        """Generate latency report."""
        return {
            "stt_latency_ms": (self.stt_end - self.stt_start) * 1000 if self.stt_end else 0,
            "rag_latency_ms": (self.rag_end - self.rag_start) * 1000 if self.rag_end else 0,
            "llm_first_token_ms": (self.llm_first_token - self.llm_start) * 1000 if self.llm_first_token else 0,
            "llm_total_ms": (self.llm_end - self.llm_start) * 1000 if self.llm_end else 0,
            "tts_latency_ms": (self.tts_end - self.tts_start) * 1000 if self.tts_end else 0,
            "total_latency_ms": (self.tts_end - self.stt_start) * 1000 if self.tts_end and self.stt_start else 0,
        }

    def print_report(self):
        """Print human-readable latency report."""
        report = self.report()
        print("\n=== Voice Pipeline Latency Report ===")
        print(f"STT (Whisper):        {report['stt_latency_ms']:.0f}ms")
        print(f"RAG Retrieval:        {report['rag_latency_ms']:.0f}ms")
        print(f"LLM First Token:      {report['llm_first_token_ms']:.0f}ms")
        print(f"LLM Total:            {report['llm_total_ms']:.0f}ms")
        print(f"TTS Generation:       {report['tts_latency_ms']:.0f}ms")
        print(f"TOTAL END-TO-END:     {report['total_latency_ms']:.0f}ms")
        print("=" * 40)


async def transcribe_audio(
    audio_file: str,
    language: Optional[str] = None,
    metrics: Optional[VoicePipelineMetrics] = None
) -> Dict[str, any]:
    """
    Transcribe audio file using OpenAI Whisper.

    Args:
        audio_file: Path to audio file (wav, mp3, m4a, etc.)
        language: ISO 639-1 language code ('he' for Hebrew, 'en' for English)
        metrics: Optional metrics tracker

    Returns:
        Dictionary with transcript, language, duration, and word-level timestamps
    """
    if metrics:
        metrics.stt_start = time.time()

    print(f"[STT] Transcribing audio: {audio_file}")

    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable not set")

    client = openai.OpenAI(api_key=OPENAI_API_KEY)

    with open(audio_file, "rb") as audio:
        params = {
            "file": audio,
            "model": "whisper-1",
            "response_format": "verbose_json",
        }

        # Specify language for better accuracy
        if language:
            params["language"] = language

        transcription = client.audio.transcriptions.create(**params)

    if metrics:
        metrics.stt_end = time.time()

    result = {
        "text": transcription.text,
        "language": transcription.language if hasattr(transcription, 'language') else language,
        "duration": transcription.duration if hasattr(transcription, 'duration') else 0,
    }

    print(f"[STT] Transcription: '{result['text']}'")
    print(f"[STT] Language: {result['language']}, Duration: {result['duration']:.2f}s")

    return result


async def retrieve_context(
    query: str,
    video_id: Optional[str] = None,
    metrics: Optional[VoicePipelineMetrics] = None
) -> str:
    """
    Retrieve relevant context using RAG (placeholder - integrate with actual RAG system).

    Args:
        query: User's question
        video_id: Optional video ID to scope search
        metrics: Optional metrics tracker

    Returns:
        Formatted context string with relevant transcript chunks
    """
    if metrics:
        metrics.rag_start = time.time()

    print(f"[RAG] Retrieving context for: '{query[:50]}...'")

    # TODO: Integrate with actual RAG system in /src/lib/rag.ts
    # For now, return placeholder context
    context = f"Context for query: '{query}' (video: {video_id or 'all'})"

    if metrics:
        metrics.rag_end = time.time()

    print(f"[RAG] Retrieved context: {len(context)} characters")

    return context


async def stream_claude_response(
    user_message: str,
    context: str,
    metrics: Optional[VoicePipelineMetrics] = None
) -> AsyncGenerator[str, None]:
    """
    Generate streaming response from Claude with RAG context.

    Args:
        user_message: User's transcribed question
        context: RAG context from transcript retrieval
        metrics: Optional metrics tracker

    Yields:
        Text chunks from Claude's response
    """
    if metrics:
        metrics.llm_start = time.time()

    print(f"[LLM] Generating response with Claude Sonnet 4...")

    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    # Build message with context
    full_message = f"""Context from course transcripts:
---
{context}
---

Student question: {user_message}"""

    first_token = True
    full_response = []

    with client.messages.stream(
        model="claude-sonnet-4-20250514",
        max_tokens=500,  # Voice responses should be concise
        system=VOICE_TUTOR_PROMPT,
        messages=[
            {
                "role": "user",
                "content": full_message,
            }
        ],
    ) as stream:
        for text in stream.text_stream:
            if first_token and metrics:
                metrics.llm_first_token = time.time()
                first_token = False

            full_response.append(text)
            yield text

    if metrics:
        metrics.llm_end = time.time()

    print(f"[LLM] Response generated: '{(''.join(full_response))[:100]}...'")


async def synthesize_speech(
    text: str,
    voice_id: str = DEFAULT_HEBREW_VOICE_ID,
    output_file: Optional[str] = None,
    metrics: Optional[VoicePipelineMetrics] = None
) -> bytes:
    """
    Convert text to speech using ElevenLabs.

    Args:
        text: Text to synthesize
        voice_id: ElevenLabs voice ID
        output_file: Optional output file path (saves audio if provided)
        metrics: Optional metrics tracker

    Returns:
        Audio bytes (MP3 format)
    """
    if metrics:
        metrics.tts_start = time.time()

    print(f"[TTS] Synthesizing speech: '{text[:50]}...'")

    if not ELEVENLABS_API_KEY:
        print("[TTS] Warning: ELEVENLABS_API_KEY not set, returning empty audio")
        return b""

    try:
        audio = generate(
            text=text,
            voice=Voice(
                voice_id=voice_id,
                settings=VoiceSettings(
                    stability=0.5,
                    similarity_boost=0.75,
                    style=0.0,
                    use_speaker_boost=True,
                )
            ),
            model="eleven_multilingual_v2",  # Supports Hebrew
        )

        # Convert generator to bytes
        audio_bytes = b"".join(audio)

        if output_file:
            with open(output_file, "wb") as f:
                f.write(audio_bytes)
            print(f"[TTS] Audio saved to: {output_file}")

        if metrics:
            metrics.tts_end = time.time()

        print(f"[TTS] Speech synthesized: {len(audio_bytes)} bytes")

        return audio_bytes

    except Exception as e:
        print(f"[TTS] Error: {e}")
        if metrics:
            metrics.tts_end = time.time()
        return b""


def split_into_sentences(text: str) -> List[str]:
    """
    Split text into sentences for chunked TTS generation.

    Args:
        text: Full text response

    Returns:
        List of sentences
    """
    # Simple sentence splitter (improve for Hebrew)
    sentences = []
    current = []

    for char in text:
        current.append(char)
        if char in ".!?":
            sentences.append("".join(current).strip())
            current = []

    # Add remaining text
    if current:
        sentences.append("".join(current).strip())

    return [s for s in sentences if s]


async def voice_pipeline_streaming(
    audio_file: str,
    language: str = "he",
    video_id: Optional[str] = None,
    output_audio: Optional[str] = None,
    chunk_size: int = 200,
) -> Dict[str, any]:
    """
    Complete voice pipeline with streaming TTS for reduced latency.

    Args:
        audio_file: Input audio file path
        language: Language code ('he' or 'en')
        video_id: Optional video ID for context scoping
        output_audio: Optional output audio file path
        chunk_size: Character count per TTS chunk

    Returns:
        Dictionary with transcript, response, and metrics
    """
    metrics = VoicePipelineMetrics()

    # Step 1: Transcribe audio
    transcription = await transcribe_audio(audio_file, language, metrics)
    user_message = transcription["text"]

    # Step 2: Retrieve context (can be parallelized with step 1 in production)
    context = await retrieve_context(user_message, video_id, metrics)

    # Step 3: Stream response from Claude
    print("[Pipeline] Streaming Claude response...")
    response_chunks = []
    buffer = []
    audio_chunks = []

    async for chunk in stream_claude_response(user_message, context, metrics):
        response_chunks.append(chunk)
        buffer.append(chunk)

        # Check if we have enough text for TTS
        current_text = "".join(buffer)
        if len(current_text) >= chunk_size or chunk.endswith((".", "!", "?")):
            # Synthesize current buffer
            if current_text.strip():
                audio = await synthesize_speech(
                    current_text.strip(),
                    voice_id=DEFAULT_HEBREW_VOICE_ID if language == "he" else DEFAULT_ENGLISH_VOICE_ID,
                    metrics=metrics if not audio_chunks else None,  # Only track first chunk
                )
                audio_chunks.append(audio)
                buffer = []

    # Synthesize any remaining text
    if buffer:
        remaining = "".join(buffer).strip()
        if remaining:
            audio = await synthesize_speech(
                remaining,
                voice_id=DEFAULT_HEBREW_VOICE_ID if language == "he" else DEFAULT_ENGLISH_VOICE_ID,
            )
            audio_chunks.append(audio)

    # Combine audio chunks
    full_audio = b"".join(audio_chunks)
    if output_audio and full_audio:
        with open(output_audio, "wb") as f:
            f.write(full_audio)
        print(f"[Pipeline] Full audio saved to: {output_audio}")

    full_response = "".join(response_chunks)

    return {
        "transcript": user_message,
        "response": full_response,
        "audio_size": len(full_audio),
        "metrics": metrics.report(),
    }


async def voice_pipeline_simple(
    audio_file: str,
    language: str = "he",
    video_id: Optional[str] = None,
    output_audio: Optional[str] = None,
) -> Dict[str, any]:
    """
    Simple voice pipeline: wait for full response before TTS.

    Args:
        audio_file: Input audio file path
        language: Language code ('he' or 'en')
        video_id: Optional video ID for context scoping
        output_audio: Optional output audio file path

    Returns:
        Dictionary with transcript, response, and metrics
    """
    metrics = VoicePipelineMetrics()

    # Step 1: Transcribe audio
    transcription = await transcribe_audio(audio_file, language, metrics)
    user_message = transcription["text"]

    # Step 2: Retrieve context
    context = await retrieve_context(user_message, video_id, metrics)

    # Step 3: Get full response from Claude
    print("[Pipeline] Generating full Claude response...")
    response_chunks = []
    async for chunk in stream_claude_response(user_message, context, metrics):
        response_chunks.append(chunk)

    full_response = "".join(response_chunks)

    # Step 4: Synthesize speech
    audio = await synthesize_speech(
        full_response,
        voice_id=DEFAULT_HEBREW_VOICE_ID if language == "he" else DEFAULT_ENGLISH_VOICE_ID,
        output_file=output_audio,
        metrics=metrics,
    )

    return {
        "transcript": user_message,
        "response": full_response,
        "audio_size": len(audio),
        "metrics": metrics.report(),
    }


async def main():
    parser = argparse.ArgumentParser(
        description="Voice AI Tutor Pipeline: STT → LLM → TTS"
    )
    parser.add_argument(
        "--audio-file",
        type=str,
        required=True,
        help="Path to input audio file (wav, mp3, m4a, etc.)",
    )
    parser.add_argument(
        "--language",
        type=str,
        default="he",
        choices=["he", "en", "auto"],
        help="Audio language: 'he' (Hebrew), 'en' (English), 'auto' (detect)",
    )
    parser.add_argument(
        "--video-id",
        type=str,
        help="Video ID for context scoping (optional)",
    )
    parser.add_argument(
        "--output-audio",
        type=str,
        help="Output audio file path (optional)",
    )
    parser.add_argument(
        "--stream",
        action="store_true",
        help="Use streaming TTS for reduced latency",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=200,
        help="Characters per TTS chunk in streaming mode (default: 200)",
    )
    parser.add_argument(
        "--voice-id",
        type=str,
        help="ElevenLabs voice ID (optional, defaults to Rachel)",
    )
    parser.add_argument(
        "--metrics-output",
        type=str,
        help="Save metrics to JSON file (optional)",
    )

    args = parser.parse_args()

    # Validate audio file exists
    if not Path(args.audio_file).exists():
        print(f"Error: Audio file not found: {args.audio_file}")
        sys.exit(1)

    # Run pipeline
    try:
        if args.stream:
            print("[Pipeline] Running STREAMING voice pipeline...")
            result = await voice_pipeline_streaming(
                audio_file=args.audio_file,
                language=args.language,
                video_id=args.video_id,
                output_audio=args.output_audio,
                chunk_size=args.chunk_size,
            )
        else:
            print("[Pipeline] Running SIMPLE voice pipeline...")
            result = await voice_pipeline_simple(
                audio_file=args.audio_file,
                language=args.language,
                video_id=args.video_id,
                output_audio=args.output_audio,
            )

        # Print results
        print("\n=== Voice Pipeline Results ===")
        print(f"Transcript: {result['transcript']}")
        print(f"Response: {result['response']}")
        print(f"Audio size: {result['audio_size']} bytes")

        # Print metrics
        metrics_obj = VoicePipelineMetrics()
        for key, value in result['metrics'].items():
            setattr(metrics_obj, key.replace('_ms', '').replace('_latency', ''), value / 1000)
        metrics_obj.print_report()

        # Save metrics if requested
        if args.metrics_output:
            with open(args.metrics_output, "w") as f:
                json.dump({
                    "transcript": result["transcript"],
                    "response": result["response"],
                    "audio_size": result["audio_size"],
                    "metrics": result["metrics"],
                }, f, indent=2)
            print(f"\nMetrics saved to: {args.metrics_output}")

    except Exception as e:
        print(f"\n[ERROR] Pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
