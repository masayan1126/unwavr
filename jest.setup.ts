import '@testing-library/jest-dom';

Object.defineProperty(window, 'localStorage', {
  value: (function createMock(): Storage {
    let store: Record<string, string> = {};
    return {
      getItem(key: string): string | null {
        return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
      },
      setItem(key: string, value: string): void {
        store[key] = value;
      },
      removeItem(key: string): void {
        delete store[key];
      },
      clear(): void {
        store = {};
      },
      key(index: number): string | null {
        return Object.keys(store)[index] ?? null;
      },
      get length(): number {
        return Object.keys(store).length;
      },
    };
  })(),
  writable: true,
});


