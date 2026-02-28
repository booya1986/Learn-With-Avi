// Mock for ioredis in tests
export default class Redis {
  async get(key: string): Promise<string | null> {
    return null;
  }

  async set(key: string, value: string, ...args: any[]): Promise<string> {
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    return 0;
  }

  async connect(): Promise<void> {
    return;
  }

  async disconnect(): Promise<void> {
    return;
  }
}
