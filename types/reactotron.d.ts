// Allow console.tron usage everywhere in DEV without TypeScript errors
interface DisplayOptions {
  name: string;
  value?: unknown;
  preview?: string;
  important?: boolean;
}

declare global {
  interface Console {
    tron: {
      log: (...args: unknown[]) => void;
      warn: (...args: unknown[]) => void;
      error: (...args: unknown[]) => void;
      display: (options: DisplayOptions) => void;
      logImportant: (...args: unknown[]) => void;
    };
  }
}

export {};
