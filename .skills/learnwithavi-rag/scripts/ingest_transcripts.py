#!/usr/bin/env python3
"""
Transcript Ingestion Script for LearnWithAvi RAG System

Processes video transcripts and creates chunks with timestamps for the vector database.

Usage:
    python ingest_transcripts.py <transcripts_folder> --output chunks.json
    python ingest_transcripts.py transcript.srt --output chunks.json --video-id abc123

Supported formats:
    - SRT (SubRip Subtitle)
    - VTT (WebVTT)
    - JSON (custom format with segments)
    - TXT (plain text with timestamps)
"""

import argparse
import json
import re
import os
from pathlib import Path
from typing import List, Dict, Any
from dataclasses import dataclass, asdict

@dataclass
class TranscriptChunk:
    id: str
    video_id: str
    video_title: str
    text: str
    start_time: int  # seconds
    end_time: int    # seconds
    topic: str
    source_url: str

def parse_srt_time(time_str: str) -> int:
    """Convert SRT timestamp (HH:MM:SS,mmm) to seconds."""
    match = re.match(r'(\d{2}):(\d{2}):(\d{2})[,.](\d{3})', time_str)
    if match:
        h, m, s, _ = match.groups()
        return int(h) * 3600 + int(m) * 60 + int(s)
    return 0

def parse_vtt_time(time_str: str) -> int:
    """Convert VTT timestamp to seconds."""
    parts = time_str.replace('.', ':').split(':')
    if len(parts) == 4:  # HH:MM:SS.mmm
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    elif len(parts) == 3:  # MM:SS.mmm
        return int(parts[0]) * 60 + int(parts[1])
    return 0

def parse_srt(content: str) -> List[Dict[str, Any]]:
    """Parse SRT file content into segments."""
    segments = []
    blocks = re.split(r'\n\n+', content.strip())

    for block in blocks:
        lines = block.strip().split('\n')
        if len(lines) >= 3:
            # Line 1: index, Line 2: timestamps, Line 3+: text
            time_match = re.match(r'(.+?)\s*-->\s*(.+)', lines[1])
            if time_match:
                start_time = parse_srt_time(time_match.group(1).strip())
                end_time = parse_srt_time(time_match.group(2).strip())
                text = ' '.join(lines[2:]).strip()
                segments.append({
                    'start': start_time,
                    'end': end_time,
                    'text': text
                })

    return segments

def parse_vtt(content: str) -> List[Dict[str, Any]]:
    """Parse VTT file content into segments."""
    segments = []
    # Skip WEBVTT header
    content = re.sub(r'^WEBVTT.*?\n\n', '', content, flags=re.DOTALL)
    blocks = re.split(r'\n\n+', content.strip())

    for block in blocks:
        lines = block.strip().split('\n')
        for i, line in enumerate(lines):
            time_match = re.match(r'(.+?)\s*-->\s*(.+)', line)
            if time_match:
                start_time = parse_vtt_time(time_match.group(1).strip())
                end_time = parse_vtt_time(time_match.group(2).strip())
                text = ' '.join(lines[i+1:]).strip()
                # Remove VTT formatting tags
                text = re.sub(r'<[^>]+>', '', text)
                if text:
                    segments.append({
                        'start': start_time,
                        'end': end_time,
                        'text': text
                    })
                break

    return segments

def parse_json_transcript(content: str) -> List[Dict[str, Any]]:
    """Parse JSON transcript file."""
    data = json.loads(content)
    if 'segments' in data:
        return data['segments']
    return data

def chunk_segments(
    segments: List[Dict[str, Any]],
    video_id: str,
    video_title: str,
    topic: str = "general",
    target_duration: int = 20,  # seconds
    overlap: int = 5  # seconds
) -> List[TranscriptChunk]:
    """
    Combine small segments into larger chunks with overlap.

    Args:
        segments: List of transcript segments with start, end, text
        video_id: YouTube video ID
        video_title: Human-readable title
        topic: Course topic/module name
        target_duration: Target chunk duration in seconds
        overlap: Overlap between chunks in seconds

    Returns:
        List of TranscriptChunk objects ready for embedding
    """
    if not segments:
        return []

    chunks = []
    current_chunk_text = []
    current_start = segments[0]['start']
    chunk_index = 0

    for segment in segments:
        current_chunk_text.append(segment['text'])
        current_end = segment['end']

        # Check if we've reached target duration
        if current_end - current_start >= target_duration:
            # Create chunk
            chunk = TranscriptChunk(
                id=f"{video_id}_chunk_{chunk_index:04d}",
                video_id=video_id,
                video_title=video_title,
                text=' '.join(current_chunk_text),
                start_time=current_start,
                end_time=current_end,
                topic=topic,
                source_url=f"https://youtube.com/watch?v={video_id}&t={current_start}"
            )
            chunks.append(chunk)
            chunk_index += 1

            # Start new chunk with overlap
            # Find segments that fall within overlap window
            overlap_start = current_end - overlap
            current_chunk_text = []
            current_start = current_end

            # Add overlapping text from previous segments
            for prev_seg in segments:
                if prev_seg['start'] >= overlap_start and prev_seg['end'] <= current_end:
                    current_chunk_text.append(prev_seg['text'])
                    current_start = min(current_start, prev_seg['start'])

    # Don't forget the last chunk
    if current_chunk_text:
        chunk = TranscriptChunk(
            id=f"{video_id}_chunk_{chunk_index:04d}",
            video_id=video_id,
            video_title=video_title,
            text=' '.join(current_chunk_text),
            start_time=current_start,
            end_time=segments[-1]['end'],
            topic=topic,
            source_url=f"https://youtube.com/watch?v={video_id}&t={current_start}"
        )
        chunks.append(chunk)

    return chunks

def process_transcript_file(
    filepath: Path,
    video_id: str = None,
    video_title: str = None,
    topic: str = "general"
) -> List[TranscriptChunk]:
    """Process a single transcript file into chunks."""

    content = filepath.read_text(encoding='utf-8')

    # Determine format and parse
    if filepath.suffix.lower() == '.srt':
        segments = parse_srt(content)
    elif filepath.suffix.lower() == '.vtt':
        segments = parse_vtt(content)
    elif filepath.suffix.lower() == '.json':
        segments = parse_json_transcript(content)
    else:
        raise ValueError(f"Unsupported format: {filepath.suffix}")

    # Use filename as defaults if not provided
    if not video_id:
        video_id = filepath.stem
    if not video_title:
        video_title = filepath.stem.replace('_', ' ').replace('-', ' ').title()

    return chunk_segments(segments, video_id, video_title, topic)

def main():
    parser = argparse.ArgumentParser(description='Ingest transcripts for LearnWithAvi RAG system')
    parser.add_argument('input', help='Transcript file or folder')
    parser.add_argument('--output', '-o', default='chunks.json', help='Output JSON file')
    parser.add_argument('--video-id', help='YouTube video ID (for single file)')
    parser.add_argument('--video-title', help='Video title (for single file)')
    parser.add_argument('--topic', default='general', help='Course topic')
    parser.add_argument('--target-duration', type=int, default=20, help='Target chunk duration in seconds')
    parser.add_argument('--overlap', type=int, default=5, help='Overlap between chunks in seconds')

    args = parser.parse_args()

    input_path = Path(args.input)
    all_chunks = []

    if input_path.is_file():
        chunks = process_transcript_file(
            input_path,
            video_id=args.video_id,
            video_title=args.video_title,
            topic=args.topic
        )
        all_chunks.extend(chunks)
    elif input_path.is_dir():
        for filepath in input_path.glob('**/*'):
            if filepath.suffix.lower() in ['.srt', '.vtt', '.json']:
                print(f"Processing: {filepath}")
                try:
                    chunks = process_transcript_file(filepath, topic=args.topic)
                    all_chunks.extend(chunks)
                except Exception as e:
                    print(f"  Error: {e}")
    else:
        raise FileNotFoundError(f"Input not found: {input_path}")

    # Save chunks to JSON
    output_data = [asdict(chunk) for chunk in all_chunks]
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\nProcessed {len(all_chunks)} chunks from transcripts")
    print(f"Output saved to: {args.output}")

if __name__ == '__main__':
    main()
