/**
 * Type declarations for the 'bm25' package
 *
 * BM25 (Best Matching 25) is a ranking function used by search engines
 * to estimate the relevance of documents to a given search query.
 */

declare module 'bm25' {
  /**
   * BM25 search implementation
   */
  export default class BM25 {
    /**
     * Create a new BM25 index
     * @param documents - Array of tokenized documents (each document is an array of tokens)
     * @param k1 - Controls term frequency saturation (default: 1.2)
     * @param b - Controls document length normalization (default: 0.75)
     */
    constructor(documents: string[][], k1?: number, b?: number);

    /**
     * Search for documents matching the query
     * @param queryTokens - Array of query tokens
     * @returns Array of scores (same order as input documents)
     */
    search(queryTokens: string[]): number[];
  }
}
