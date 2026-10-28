export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class HighScoreStore {
  constructor(
    private storage: KeyValueStorage | null,
    private key = 'gali-runner-best',
  ) {}

  get(): number {
    try {
      const value = Number(this.storage?.getItem(this.key));
      return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    } catch {
      return 0;
    }
  }

  /** Stores the score if it beats the best. Returns true for a new record. */
  submit(score: number): boolean {
    if (score <= this.get()) return false;
    try {
      this.storage?.setItem(this.key, String(Math.floor(score)));
    } catch {
      // Storage may be unavailable (private mode); the record just isn't persisted.
    }
    return true;
  }
}
