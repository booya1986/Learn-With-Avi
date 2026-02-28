// Mock for 'ai' package in tests
export const streamText = (options: any) => {
  // Create an async generator that yields mock text
  async function* mockTextStream() {
    yield 'This is ';
    yield 'a mocked ';
    yield 'streaming ';
    yield 'response.';
  }

  return {
    textStream: mockTextStream(),
    fullStream: mockTextStream(),
  };
};
