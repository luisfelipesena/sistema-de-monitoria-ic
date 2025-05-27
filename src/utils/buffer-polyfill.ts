// Buffer polyfill for @react-pdf/renderer in browser environment

declare global {
  interface Window {
    Buffer: any;
    global: any;
    process: any;
  }
}

// Polyfill global
if (typeof window !== 'undefined') {
  if (typeof window.global === 'undefined') {
    window.global = window;
  }

  // Polyfill Buffer
  if (typeof window.Buffer === 'undefined') {
    window.Buffer = {
      from: (str: string, encoding?: string) => {
        return new TextEncoder().encode(str);
      },
      isBuffer: (obj: any) => {
        return obj instanceof Uint8Array;
      },
      alloc: (size: number) => {
        return new Uint8Array(size);
      },
    };
  }

  // Polyfill process
  if (typeof window.process === 'undefined') {
    window.process = {
      env: { NODE_ENV: 'development' },
      nextTick: (fn: Function) => setTimeout(fn, 0),
      browser: true,
    };
  }
}

export {};
