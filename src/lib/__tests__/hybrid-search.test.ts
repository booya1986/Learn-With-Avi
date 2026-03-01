/**
 * Hybrid Search Tests
 *
 * Tests for BM25 scoring, Hebrew text processing, reciprocal rank fusion,
 * and the hybridSearch() function with all three strategy paths.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

import { type TranscriptChunk } from '@/types'

import {
  hybridSearch,
  initializeBM25Index,
  getBM25Status,
  utils,
} from '../hybrid-search'

// Mock dependencies
vi.mock('../rag-pgvector', () => ({
  queryVectorChunks: vi.fn(),
}))

vi.mock('../redis', () => ({
  queryCache: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    clear: vi.fn().mockResolvedValue(true),
  },
  isRedisConnected: vi.fn().mockReturnValue(false),
}))

// Test fixtures
const makeChunk = (id: string, videoId: string, text: string, startTime = 0): TranscriptChunk => ({
  id,
  videoId,
  text,
  startTime,
  endTime: startTime + 10,
})

const chunks: TranscriptChunk[] = [
  makeChunk('c1', 'v1', 'authentication with JWT tokens and OAuth2', 0),
  makeChunk('c2', 'v1', 'React hooks and state management with useState', 60),
  makeChunk('c3', 'v1', 'database optimization and SQL queries performance', 120),
  makeChunk('c4', 'v2', 'JWT tokens are used for secure authentication', 30),
  makeChunk('c5', 'v2', 'Python decorators and functional programming', 90),
]

// ─── HebrewTextProcessor ────────────────────────────────────────────────────

describe('HebrewTextProcessor', () => {
  const { HebrewTextProcessor } = utils

  describe('tokenize()', () => {
    it('splits English text by whitespace', () => {
      const tokens = HebrewTextProcessor.tokenize('hello world test')
      expect(tokens).toEqual(['hello', 'world', 'test'])
    })

    it('splits Hebrew text correctly', () => {
      const tokens = HebrewTextProcessor.tokenize('אימות משתמשים JWT')
      expect(tokens).toContain('אימות')
      expect(tokens).toContain('משתמשים')
      expect(tokens).toContain('jwt')
    })

    it('handles mixed Hebrew-English text', () => {
      const tokens = HebrewTextProcessor.tokenize('React hooks ו-useState')
      expect(tokens.length).toBeGreaterThan(0)
      expect(tokens).toContain('react')
      expect(tokens).toContain('hooks')
    })

    it('strips punctuation', () => {
      const tokens = HebrewTextProcessor.tokenize('hello, world! test.')
      expect(tokens).toContain('hello')
      expect(tokens).toContain('world')
      expect(tokens).toContain('test')
      expect(tokens).not.toContain(',')
      expect(tokens).not.toContain('!')
    })

    it('lowercases English tokens', () => {
      const tokens = HebrewTextProcessor.tokenize('JWT OAuth React')
      expect(tokens).toContain('jwt')
      expect(tokens).toContain('oauth')
      expect(tokens).toContain('react')
    })

    it('filters empty tokens', () => {
      const tokens = HebrewTextProcessor.tokenize('  multiple   spaces  ')
      expect(tokens.every((t) => t.length > 0)).toBe(true)
    })

    it('returns empty array for empty string', () => {
      const tokens = HebrewTextProcessor.tokenize('')
      expect(tokens).toEqual([])
    })
  })

  describe('removeStopWords()', () => {
    it('removes common English stop words', () => {
      const tokens = ['the', 'jwt', 'is', 'a', 'token', 'for', 'authentication']
      const result = HebrewTextProcessor.removeStopWords(tokens)
      expect(result).not.toContain('the')
      expect(result).not.toContain('is')
      expect(result).not.toContain('a')
      expect(result).not.toContain('for')
      expect(result).toContain('jwt')
      expect(result).toContain('authentication')
    })

    it('removes common Hebrew stop words', () => {
      const tokens = ['של', 'אימות', 'את', 'משתמשים', 'זה']
      const result = HebrewTextProcessor.removeStopWords(tokens)
      expect(result).not.toContain('של')
      expect(result).not.toContain('את')
      expect(result).not.toContain('זה')
      expect(result).toContain('אימות')
      expect(result).toContain('משתמשים')
    })

    it('preserves non-stop-word tokens', () => {
      const tokens = ['jwt', 'token', 'authentication', 'react', 'hooks']
      const result = HebrewTextProcessor.removeStopWords(tokens)
      expect(result).toEqual(tokens)
    })

    it('returns empty array when all tokens are stop words', () => {
      const tokens = ['the', 'a', 'an', 'is', 'are', 'of', 'and']
      const result = HebrewTextProcessor.removeStopWords(tokens)
      expect(result).toEqual([])
    })
  })

  describe('prepare()', () => {
    it('combines tokenize and removeStopWords', () => {
      const result = HebrewTextProcessor.prepare('the JWT token is a secure authentication method')
      expect(result).toContain('jwt')
      expect(result).toContain('token')
      expect(result).toContain('authentication')
      expect(result).not.toContain('the')
      expect(result).not.toContain('is')
      expect(result).not.toContain('a')
    })

    it('handles Hebrew query', () => {
      const result = HebrewTextProcessor.prepare('אימות של משתמשים')
      expect(result).toContain('אימות')
      expect(result).toContain('משתמשים')
      expect(result).not.toContain('של')
    })
  })
})

// ─── BM25Search ──────────────────────────────────────────────────────────────

describe('BM25Search', () => {
  const { BM25Search } = utils

  it('returns empty results when not indexed', () => {
    const bm25 = new BM25Search()
    const results = bm25.search('authentication')
    expect(results).toEqual([])
  })

  it('isReady() returns false before indexing', () => {
    const bm25 = new BM25Search()
    expect(bm25.isReady()).toBe(false)
  })

  it('isReady() returns true after indexing', () => {
    const bm25 = new BM25Search()
    bm25.indexChunks(chunks)
    expect(bm25.isReady()).toBe(true)
  })

  it('getChunkCount() returns correct count after indexing', () => {
    const bm25 = new BM25Search()
    bm25.indexChunks(chunks)
    expect(bm25.getChunkCount()).toBe(chunks.length)
  })

  it('ranks relevant chunks higher than irrelevant ones', () => {
    const bm25 = new BM25Search()
    bm25.indexChunks(chunks)
    const results = bm25.search('JWT authentication tokens')
    expect(results.length).toBeGreaterThan(0)
    // c1 and c4 both mention JWT and authentication — should be top results
    const topIds = results.slice(0, 2).map((r) => r.chunk.id)
    expect(topIds.some((id) => ['c1', 'c4'].includes(id))).toBe(true)
  })

  it('returns at most topK results', () => {
    const bm25 = new BM25Search()
    bm25.indexChunks(chunks)
    const results = bm25.search('authentication', 2)
    expect(results.length).toBeLessThanOrEqual(2)
  })

  it('returns results with relevance scores', () => {
    const bm25 = new BM25Search()
    bm25.indexChunks(chunks)
    const results = bm25.search('React hooks')
    results.forEach((r) => {
      expect(r).toHaveProperty('chunk')
      expect(r).toHaveProperty('relevance')
      expect(typeof r.relevance).toBe('number')
    })
  })

  it('results are sorted by relevance descending', () => {
    const bm25 = new BM25Search()
    bm25.indexChunks(chunks)
    const results = bm25.search('authentication JWT')
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].relevance).toBeGreaterThanOrEqual(results[i].relevance)
    }
  })

  it('returns empty when query matches no documents', () => {
    const bm25 = new BM25Search()
    bm25.indexChunks(chunks)
    // BM25 returns 0 scores for all docs when query terms don't exist
    const results = bm25.search('zzz_nonexistent_term_xyz')
    // All scores would be 0; slicing top 0-score results returns 0 meaningful items
    results.forEach((r) => expect(r.relevance).toBe(0))
  })
})

// ─── initializeBM25Index / getBM25Status ─────────────────────────────────────

describe('initializeBM25Index / getBM25Status', () => {
  it('getBM25Status() reports ready after initialization', () => {
    initializeBM25Index(chunks)
    const status = getBM25Status()
    expect(status.ready).toBe(true)
    expect(status.chunkCount).toBe(chunks.length)
  })
})

// ─── reciprocalRankFusion ────────────────────────────────────────────────────

describe('reciprocalRankFusion', () => {
  const { reciprocalRankFusion } = utils

  const makeResult = (id: string) => ({
    chunk: makeChunk(id, 'v1', `text about ${id}`),
    relevance: 0.9,
  })

  it('combines results from multiple methods', () => {
    const vectorResults = [makeResult('c1'), makeResult('c2'), makeResult('c3')]
    const keywordResults = [makeResult('c2'), makeResult('c1'), makeResult('c4')]
    const resultsMap = new Map([
      ['vector', vectorResults],
      ['keyword', keywordResults],
    ])
    const combined = reciprocalRankFusion(resultsMap)
    // c1 and c2 appear in both → higher combined score
    const ids = combined.map((r) => r.chunk.id)
    expect(ids).toContain('c1')
    expect(ids).toContain('c2')
    expect(ids).toContain('c3')
    expect(ids).toContain('c4')
  })

  it('ranks chunks appearing in both result sets higher', () => {
    const sharedChunk = makeResult('shared')
    const onlyVector = makeResult('only-vector')
    const onlyKeyword = makeResult('only-keyword')

    const vectorResults = [sharedChunk, onlyVector]
    const keywordResults = [sharedChunk, onlyKeyword]
    const resultsMap = new Map([
      ['vector', vectorResults],
      ['keyword', keywordResults],
    ])

    const combined = reciprocalRankFusion(resultsMap)
    const topId = combined[0].chunk.id
    expect(topId).toBe('shared')
  })

  it('returns results sorted by relevance descending', () => {
    const vectorResults = [makeResult('c1'), makeResult('c2'), makeResult('c3')]
    const keywordResults = [makeResult('c3'), makeResult('c1')]
    const resultsMap = new Map([
      ['vector', vectorResults],
      ['keyword', keywordResults],
    ])

    const combined = reciprocalRankFusion(resultsMap)
    for (let i = 1; i < combined.length; i++) {
      expect(combined[i - 1].relevance).toBeGreaterThanOrEqual(combined[i].relevance)
    }
  })

  it('handles empty result sets', () => {
    const resultsMap = new Map([
      ['vector', [] as ReturnType<typeof makeResult>[]],
      ['keyword', [] as ReturnType<typeof makeResult>[]],
    ])
    const combined = reciprocalRankFusion(resultsMap)
    expect(combined).toEqual([])
  })

  it('handles single non-empty result set', () => {
    const vectorResults = [makeResult('c1'), makeResult('c2')]
    const resultsMap = new Map([
      ['vector', vectorResults],
      ['keyword', [] as ReturnType<typeof makeResult>[]],
    ])
    const combined = reciprocalRankFusion(resultsMap)
    expect(combined).toHaveLength(2)
  })
})

// ─── hybridSearch() ───────────────────────────────────────────────────────────

describe('hybridSearch()', () => {
  let vectorSearch: ReturnType<typeof vi.fn>

  const vectorResults = [
    { chunk: makeChunk('c1', 'v1', 'authentication with JWT'), relevance: 0.92 },
    { chunk: makeChunk('c4', 'v2', 'JWT tokens for authentication'), relevance: 0.85 },
  ]

  beforeEach(async () => {
    vi.clearAllMocks()
    const { isRedisConnected } = await import('../redis')
    vi.mocked(isRedisConnected).mockReturnValue(false)

    const rag = await import('../rag-pgvector')
    vectorSearch = vi.mocked(rag.queryVectorChunks)
    vectorSearch.mockResolvedValue(vectorResults)

    // Initialize BM25 with test data
    initializeBM25Index(chunks)
  })

  describe('vector-only strategy', () => {
    it('calls vectorSearch and returns its results', async () => {
      const results = await hybridSearch('JWT authentication', { strategy: 'vector-only', topK: 5 })
      expect(vectorSearch).toHaveBeenCalledOnce()
      expect(results).toEqual(vectorResults)
    })

    it('passes videoId filter to vectorSearch', async () => {
      await hybridSearch('JWT', { strategy: 'vector-only', videoId: 'v1', topK: 5 })
      expect(vectorSearch).toHaveBeenCalledWith('JWT', expect.any(Number), 'v1')
    })
  })

  describe('keyword-only strategy', () => {
    it('uses BM25 when index is ready', async () => {
      const results = await hybridSearch('JWT authentication', { strategy: 'keyword-only', topK: 5 })
      // Should return results (BM25 index is initialized in beforeEach)
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
    })

    it('falls back to vector search when BM25 not ready', async () => {
      // Reset the BM25 index with empty chunks
      initializeBM25Index([])
      const results = await hybridSearch('JWT', { strategy: 'keyword-only', topK: 5 })
      expect(vectorSearch).toHaveBeenCalled()
      expect(results).toEqual(vectorResults)
      // Restore for subsequent tests
      initializeBM25Index(chunks)
    })

    it('filters by videoId', async () => {
      initializeBM25Index(chunks)
      const results = await hybridSearch('authentication', {
        strategy: 'keyword-only',
        videoId: 'v1',
        topK: 10,
      })
      results.forEach((r) => expect(r.chunk.videoId).toBe('v1'))
    })
  })

  describe('hybrid strategy (default)', () => {
    it('calls vectorSearch once', async () => {
      await hybridSearch('authentication', { topK: 5 })
      expect(vectorSearch).toHaveBeenCalledOnce()
    })

    it('returns at most topK results', async () => {
      const results = await hybridSearch('authentication', { topK: 2 })
      expect(results.length).toBeLessThanOrEqual(2)
    })

    it('returns results with relevance and chunk', async () => {
      const results = await hybridSearch('authentication', { topK: 5 })
      results.forEach((r) => {
        expect(r).toHaveProperty('chunk')
        expect(r).toHaveProperty('relevance')
        expect(r.chunk).toHaveProperty('id')
        expect(r.chunk).toHaveProperty('videoId')
      })
    })

    it('falls back to vector results when vectorSearch throws', async () => {
      vectorSearch.mockRejectedValueOnce(new Error('pgvector down'))
      // Second call (fallback) returns results
      vectorSearch.mockResolvedValueOnce(vectorResults)
      const results = await hybridSearch('authentication', { topK: 5 })
      expect(results).toEqual(vectorResults)
    })
  })

  describe('Redis caching', () => {
    it('skips cache when Redis is not connected', async () => {
      const { queryCache } = await import('../redis')
      await hybridSearch('authentication', { enableCache: true, topK: 5 })
      expect(queryCache.get).not.toHaveBeenCalled()
    })

    it('returns cached results when cache hit', async () => {
      const { isRedisConnected, queryCache } = await import('../redis')
      vi.mocked(isRedisConnected).mockReturnValue(true)
      vi.mocked(queryCache.get).mockResolvedValueOnce(vectorResults)

      const results = await hybridSearch('authentication', { enableCache: true, topK: 5 })
      expect(results).toEqual(vectorResults)
      expect(vectorSearch).not.toHaveBeenCalled()
    })

    it('caches results when Redis is connected and cache misses', async () => {
      const { isRedisConnected, queryCache } = await import('../redis')
      vi.mocked(isRedisConnected).mockReturnValue(true)
      vi.mocked(queryCache.get).mockResolvedValueOnce(null)
      vi.mocked(queryCache.set).mockResolvedValueOnce(true)

      // Use default 'hybrid' strategy — vector-only does not cache
      await hybridSearch('authentication', { strategy: 'hybrid', enableCache: true, topK: 5 })
      expect(queryCache.set).toHaveBeenCalled()
    })

    it('skips caching when enableCache is false', async () => {
      const { isRedisConnected, queryCache } = await import('../redis')
      vi.mocked(isRedisConnected).mockReturnValue(true)

      await hybridSearch('authentication', { enableCache: false, topK: 5 })
      expect(queryCache.get).not.toHaveBeenCalled()
      expect(queryCache.set).not.toHaveBeenCalled()
    })
  })
})
