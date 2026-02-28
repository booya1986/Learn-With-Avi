// Mock for 'openai' package in tests
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RateLimitError'
  }
}

export default class OpenAI {
  audio: any
  embeddings: any

  constructor(options?: any) {
    this.audio = {
      transcriptions: {
        create: async (options: any) => ({
          text: 'mocked transcription',
          language: 'en',
          duration: 0,
        }),
      },
    }
    this.embeddings = {
      create: async (options: any) => ({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      }),
    }
  }

  static RateLimitError = RateLimitError
}
