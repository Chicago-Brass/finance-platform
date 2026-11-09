export class RetryableError extends Error {
  readonly delayMs?: number;
  constructor(message: string, delayMs?: number) { super(message); this.delayMs = delayMs; }
}
export class BudgetExceeded extends Error {}
export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// Only transient failures retry. Posting retries reuse the same source/category identity.
export async function retry<T>(operation: () => Promise<T>, options: {
  deadline?: number; attempts?: number; wait?: (ms: number) => Promise<void>;
} = {}): Promise<T> {
  const { deadline = Infinity, attempts = 3, wait = sleep } = options;
  for (let attempt = 0; ; attempt++) {
    if (Date.now() >= deadline) throw new BudgetExceeded("Run budget reached; resume this run.");
    try { return await operation(); }
    catch (error) {
      if (!(error instanceof RetryableError) || attempt + 1 >= attempts) throw error;
      const delay = error.delayMs ?? 500 * 2 ** attempt;
      if (Date.now() + delay + 20_000 >= deadline) throw new BudgetExceeded("Not enough time for retry; resume this run.");
      await wait(delay);
    }
  }
}
