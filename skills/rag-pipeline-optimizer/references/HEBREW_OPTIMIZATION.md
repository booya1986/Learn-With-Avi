# Hebrew Optimization for RAG Systems

Complete guide to optimizing RAG pipelines for Hebrew language content, including text normalization, embedding strategies, and code-switching handling.

## Table of Contents

1. [Hebrew Language Challenges](#hebrew-language-challenges)
2. [Text Preprocessing](#text-preprocessing)
3. [Embedding Model Selection](#embedding-model-selection)
4. [Chunking Strategies](#chunking-strategies)
5. [Search Optimization](#search-optimization)
6. [Code-Switching](#code-switching)
7. [Testing & Evaluation](#testing--evaluation)

---

## Hebrew Language Challenges

### Unique Characteristics

Hebrew introduces several challenges for RAG systems:

1. **Right-to-Left (RTL) Text Direction**
   - Affects text rendering and display
   - Mixed RTL-LTR in technical content (Hebrew + English)
   - Requires proper Unicode handling

2. **Morphological Complexity**
   - Prefixes: ב (in), ה (the), ו (and), כ (as), ל (to), מ (from), ש (that)
   - Suffixes: Gender, plurality, possessive pronouns
   - Example: במחשבים = ב (in) + מחשב (computer) + ים (plural)

3. **Final Letter Forms**
   - 5 Hebrew letters have final forms: ך, ם, ן, ף, ץ
   - Regular forms: כ, מ, נ, פ, צ
   - Can affect exact matching in keyword search

4. **Nikud (Vowel Marks)**
   - Diacritical marks for vowels: ַ ָ ֶ ֵ ִ ֹ ֻ ְ ֲ
   - Rarely used in modern text
   - Can interfere with embeddings if present

5. **Code-Switching**
   - Technical terms often in English
   - Example: "בעזרת RAG system אפשר לשפר את התשובות"
   - Requires multilingual handling

---

## Text Preprocessing

### Step 1: Remove Nikud

Remove Hebrew vowel marks that rarely appear in modern text:

```python
import re

def remove_nikud(text: str) -> str:
    """
    Remove Hebrew nikud (diacritical marks).

    Unicode range: U+0591 to U+05C7
    """
    return re.sub(r'[\u0591-\u05C7]', '', text)

# Example
text = "הַמַּחְשֵׁב"
clean = remove_nikud(text)  # "המחשב"
```

### Step 2: Normalize Final Letters

Convert final letter forms to their regular equivalents:

```python
def normalize_final_letters(text: str) -> str:
    """
    Normalize Hebrew final letters to regular forms.

    ך → כ, ם → מ, ן → נ, ף → פ, ץ → צ
    """
    final_to_normal = str.maketrans('ךםןףץ', 'כמנפצ')
    return text.translate(final_to_normal)

# Example
text = "מילים"  # "words"
normalized = normalize_final_letters(text)  # "מילימ"
```

**Note**: Final letter normalization improves keyword matching but may reduce readability. Use selectively:
- ✅ Apply for BM25 indexing (exact matching)
- ❌ Avoid for display text (preserve natural Hebrew)
- ❌ Avoid for embeddings (models handle final letters)

### Step 3: Whitespace & Punctuation

Standard text cleaning:

```python
def clean_hebrew_text(text: str) -> str:
    """
    Clean Hebrew text for indexing.
    """
    # Remove nikud
    text = remove_nikud(text)

    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)

    # Remove isolated punctuation (keep in-word hyphens)
    text = re.sub(r'(?<!\w)[^\w\s](?!\w)', ' ', text)

    # Strip
    return text.strip()
```

### Complete Preprocessing Pipeline

```python
def preprocess_hebrew_text(
    text: str,
    normalize_finals: bool = False,
    lowercase_english: bool = True
) -> str:
    """
    Full Hebrew text preprocessing pipeline.

    Args:
        text: Input text
        normalize_finals: Whether to normalize final letters (for BM25)
        lowercase_english: Lowercase English words (for case-insensitive matching)

    Returns:
        Preprocessed text
    """
    # Remove nikud
    text = remove_nikud(text)

    # Normalize final letters (optional)
    if normalize_finals:
        text = normalize_final_letters(text)

    # Lowercase English words only (preserve Hebrew case)
    if lowercase_english:
        words = text.split()
        words = [
            word.lower() if re.match(r'^[a-zA-Z]+$', word) else word
            for word in words
        ]
        text = ' '.join(words)

    # Clean whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    return text
```

---

## Embedding Model Selection

### Recommended Models

#### 1. OpenAI text-embedding-3-small (Recommended for LearnWithAvi)

**Pros**:
- Excellent multilingual support (including Hebrew)
- 1536 dimensions
- Cost-effective
- No local GPU required

**Cons**:
- API cost (mitigated by caching)
- Requires internet connection

```python
import openai

def get_hebrew_embedding(text: str) -> list[float]:
    """Get embedding for Hebrew text."""
    # No special preprocessing needed - model handles Hebrew natively
    response = openai.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding
```

#### 2. Multilingual-E5 (sentence-transformers)

**Pros**:
- Open-source, runs locally
- Good Hebrew support
- Free

**Cons**:
- Lower quality than OpenAI for Hebrew
- Requires GPU for acceptable speed

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('intfloat/multilingual-e5-large')

def get_hebrew_embedding_e5(text: str) -> list[float]:
    """Get embedding using E5 model."""
    # Add task prefix for better results
    text_with_prefix = f"query: {text}"
    return model.encode(text_with_prefix)
```

#### 3. AlephBERT (Hebrew-Specific)

**Pros**:
- Trained specifically on Hebrew
- Best morphological understanding

**Cons**:
- Not optimized for semantic search
- Requires fine-tuning for embeddings
- No official embedding model

**Recommendation**: Use OpenAI text-embedding-3-small for LearnWithAvi unless offline operation is required.

---

## Chunking Strategies

### Hebrew-Aware Sentence Splitting

Hebrew uses the same punctuation as English but has unique challenges:

```python
def split_hebrew_sentences(text: str) -> list[str]:
    """
    Split Hebrew text into sentences.
    """
    # Hebrew sentence endings: . ? ! (same as English)
    # But handle abbreviations: ד״ר (Dr.), ת״א (Tel Aviv), etc.

    # Split on sentence endings
    sentences = re.split(r'[.!?]+', text)

    # Filter empty
    sentences = [s.strip() for s in sentences if s.strip()]

    return sentences
```

### Optimal Chunk Sizes

For Hebrew technical content (like LearnWithAvi videos):

| Chunk Type | Word Count | Character Count | Use Case |
|------------|-----------|----------------|----------|
| Small | 50-100 | 300-600 | Precise citations |
| Medium | 100-200 | 600-1200 | Balanced (recommended) |
| Large | 200-400 | 1200-2400 | Contextual understanding |

**Hebrew Consideration**: Hebrew words are typically shorter than English, so character-based chunking may not align well. Use word-based chunking for better consistency.

```python
def chunk_hebrew_text(
    text: str,
    chunk_size: int = 150,  # words
    overlap: int = 30  # words
) -> list[dict]:
    """
    Chunk Hebrew text with overlap.

    Args:
        text: Input text
        chunk_size: Target chunk size in words
        overlap: Overlap between chunks in words

    Returns:
        List of chunks with metadata
    """
    words = text.split()
    chunks = []

    for i in range(0, len(words), chunk_size - overlap):
        chunk_words = words[i:i + chunk_size]
        chunk_text = ' '.join(chunk_words)

        chunks.append({
            'text': chunk_text,
            'start_word': i,
            'end_word': i + len(chunk_words),
            'word_count': len(chunk_words)
        })

    return chunks
```

---

## Search Optimization

### Hybrid Search for Hebrew

Combine BM25 (exact matching) with semantic search:

```python
from rank_bm25 import BM25Okapi

def hebrew_hybrid_search(
    query: str,
    corpus: list[str],
    bm25_index: BM25Okapi,
    embedding_index: Any,  # ChromaDB collection
    bm25_weight: float = 0.4,
    semantic_weight: float = 0.6
) -> list[dict]:
    """
    Hybrid search optimized for Hebrew.

    Higher BM25 weight for Hebrew due to morphological complexity.
    """
    # Preprocess query for BM25
    query_normalized = preprocess_hebrew_text(
        query,
        normalize_finals=True,
        lowercase_english=True
    )

    # BM25 search
    bm25_scores = bm25_index.get_scores(query_normalized.split())

    # Semantic search (no preprocessing - model handles Hebrew)
    semantic_results = embedding_index.query(query)

    # Combine scores...
    # (see hybrid_search.py for full implementation)
```

### Query Expansion for Hebrew

Handle morphological variations:

```python
def expand_hebrew_query(query: str) -> list[str]:
    """
    Expand Hebrew query with morphological variations.

    Example: "מחשב" → ["מחשב", "מחשבים", "המחשב", "למחשב"]
    """
    expanded = [query]

    words = query.split()

    for word in words:
        # Check if Hebrew word (not English)
        if re.search(r'[\u0590-\u05FF]', word):
            # Add common prefixes
            prefixes = ['ה', 'ב', 'ל', 'מ', 'ו', 'כ', 'ש']
            for prefix in prefixes:
                if not word.startswith(prefix):
                    expanded.append(prefix + word)

            # Add plural form (simplified heuristic)
            if not word.endswith('ים') and not word.endswith('ות'):
                expanded.append(word + 'ים')

    return list(set(expanded))

# Example
query = "מחשב"
expanded = expand_hebrew_query(query)
# ["מחשב", "המחשב", "במחשב", "למחשב", "ממחשב", "ומחשב", "כמחשב", "שמחשב", "מחשבים"]
```

**Caution**: Query expansion can reduce precision. Use sparingly, especially with semantic search.

---

## Code-Switching

### Detecting Mixed Hebrew-English Text

```python
def detect_language_mix(text: str) -> dict:
    """
    Detect proportion of Hebrew vs English in text.
    """
    hebrew_chars = len(re.findall(r'[\u0590-\u05FF]', text))
    english_chars = len(re.findall(r'[a-zA-Z]', text))
    total_chars = hebrew_chars + english_chars

    if total_chars == 0:
        return {'hebrew': 0.0, 'english': 0.0, 'mixed': False}

    hebrew_ratio = hebrew_chars / total_chars
    english_ratio = english_chars / total_chars

    # Consider "mixed" if both languages have >20%
    is_mixed = hebrew_ratio > 0.2 and english_ratio > 0.2

    return {
        'hebrew': hebrew_ratio,
        'english': english_ratio,
        'mixed': is_mixed
    }

# Example
text = "בעזרת RAG system אפשר לשפר את התשובות"
lang_info = detect_language_mix(text)
# {'hebrew': 0.68, 'english': 0.32, 'mixed': True}
```

### Handling Technical Terms

Preserve English technical terms in Hebrew text:

```python
def preserve_technical_terms(text: str) -> str:
    """
    Identify and preserve English technical terms in Hebrew text.
    """
    # Common technical term patterns
    patterns = [
        r'\b[A-Z]{2,}\b',  # Acronyms (RAG, API, ML, NLP)
        r'\b[A-Z][a-z]+(?:[A-Z][a-z]+)*\b',  # CamelCase
        r'\b\w+_\w+\b',  # snake_case
        r'\b[a-z]+\.[a-z]+\b',  # file.txt
    ]

    # Extract technical terms
    technical_terms = []
    for pattern in patterns:
        technical_terms.extend(re.findall(pattern, text))

    return technical_terms

# Example
text = "בעזרת RAG system ו-ChromaDB אפשר לבנות embedding_cache יעיל"
terms = preserve_technical_terms(text)
# ['RAG', 'ChromaDB', 'embedding_cache']
```

### Bilingual Chunking Strategy

Keep mixed-language chunks together:

```python
def chunk_mixed_hebrew_english(
    text: str,
    chunk_size: int = 150
) -> list[dict]:
    """
    Chunk text while preserving Hebrew-English language boundaries.
    """
    # Split into sentences
    sentences = split_hebrew_sentences(text)

    chunks = []
    current_chunk = []
    current_word_count = 0

    for sentence in sentences:
        sentence_words = sentence.split()
        sentence_word_count = len(sentence_words)

        # Check if adding sentence exceeds chunk size
        if current_word_count + sentence_word_count > chunk_size and current_chunk:
            # Save current chunk
            chunks.append({
                'text': ' '.join(current_chunk),
                'word_count': current_word_count,
                'language_mix': detect_language_mix(' '.join(current_chunk))
            })
            current_chunk = []
            current_word_count = 0

        # Add sentence to current chunk
        current_chunk.append(sentence)
        current_word_count += sentence_word_count

    # Add final chunk
    if current_chunk:
        chunks.append({
            'text': ' '.join(current_chunk),
            'word_count': current_word_count,
            'language_mix': detect_language_mix(' '.join(current_chunk))
        })

    return chunks
```

---

## Testing & Evaluation

### Hebrew-Specific Test Cases

Create test queries covering common patterns:

```python
HEBREW_TEST_QUERIES = [
    # Pure Hebrew
    "מה זה embeddings?",
    "איך עובד RAG system?",
    "הסבר על vector database",

    # Hebrew with English terms
    "מה ההבדל בין fine-tuning ל-prompt engineering?",
    "איך מטמיעים ChromaDB בפרויקט?",

    # Technical acronyms
    "מה זה API ואיך משתמשים בו?",
    "הסבר על NLP בעברית",

    # Morphological variations
    "מחשב",  # computer (singular)
    "מחשבים",  # computers (plural)
    "במחשב",  # in the computer (with prefix)
    "המחשבים",  # the computers (definite article + plural)
]
```

### Evaluation Metrics for Hebrew

```python
def evaluate_hebrew_rag(
    queries: list[str],
    rag_system: Any
) -> dict:
    """
    Evaluate RAG system on Hebrew queries.
    """
    results = {
        'pure_hebrew': [],
        'mixed_language': [],
        'with_acronyms': []
    }

    for query in queries:
        lang_info = detect_language_mix(query)

        # Classify query type
        if lang_info['english'] < 0.1:
            category = 'pure_hebrew'
        elif re.search(r'\b[A-Z]{2,}\b', query):
            category = 'with_acronyms'
        else:
            category = 'mixed_language'

        # Query RAG system
        response = rag_system.query(query)

        # Evaluate
        score = evaluate_response(query, response)
        results[category].append(score)

    # Calculate averages
    return {
        cat: sum(scores) / len(scores) if scores else 0.0
        for cat, scores in results.items()
    }
```

---

## Best Practices Summary

### Do's

✅ **Use multilingual embeddings** (OpenAI text-embedding-3-small)
✅ **Remove nikud** from text before indexing
✅ **Preserve English technical terms** in mixed content
✅ **Use hybrid search** (BM25 + semantic) with higher BM25 weight for Hebrew
✅ **Test with mixed-language queries**
✅ **Handle RTL display** correctly in UI

### Don'ts

❌ **Don't normalize final letters** for embeddings (models handle them)
❌ **Don't lowercase Hebrew** (case doesn't exist in Hebrew)
❌ **Don't split code-switched text** across chunk boundaries
❌ **Don't rely on English-only models** for Hebrew semantic search
❌ **Don't ignore morphological variations** in evaluation

---

## Integration with LearnWithAvi

### Update Preprocessing Pipeline

```typescript
// src/lib/hebrew-preprocessing.ts

export function preprocessHebrewText(text: string): string {
  // Remove nikud
  text = text.replace(/[\u0591-\u05C7]/g, '');

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

export function normalizeForBM25(text: string): string {
  // More aggressive normalization for keyword search
  text = preprocessHebrewText(text);

  // Normalize final letters for exact matching
  const finalToNormal: Record<string, string> = {
    'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ'
  };

  for (const [final, normal] of Object.entries(finalToNormal)) {
    text = text.replace(new RegExp(final, 'g'), normal);
  }

  return text;
}
```

### Update RAG Query Handler

```typescript
// src/lib/rag.ts

import { preprocessHebrewText, normalizeForBM25 } from './hebrew-preprocessing';

export async function queryChunks(
  query: string,
  topK: number = 5,
  videoId?: string
): Promise<QueryResult[]> {
  // Preprocess query for BM25
  const normalizedQuery = normalizeForBM25(query);

  // Semantic search uses original query (embeddings handle Hebrew)
  const semanticResults = await vectorSearch(query, topK * 2);
  const bm25Results = await keywordSearch(normalizedQuery, topK * 2);

  // Hybrid fusion
  return hybridRanking(semanticResults, bm25Results, topK);
}
```

---

## Resources

- [Hebrew NLP Resources](https://github.com/NNLP-IL/Hebrew-Resources)
- [AlephBERT](https://github.com/OnlpLab/AlephBERT)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [Unicode Hebrew Chart](https://www.unicode.org/charts/PDF/U0590.pdf)
- [Hebrew Text Processing (Python)](https://github.com/OriYarden/Hebrew-Tokenizer)

---

**Last Updated**: January 2026
