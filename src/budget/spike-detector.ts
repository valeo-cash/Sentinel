import { parseUSDC, formatUSDC, calculateAverage } from "../utils/money";

/** Detects abnormal payment spikes using a rolling window of recent amounts */
export class SpikeDetector {
  private readonly windowSize: number;
  private readonly threshold: number;
  private readonly window: string[] = [];

  constructor(threshold = 3.0, windowSize = 20) {
    this.threshold = threshold;
    this.windowSize = windowSize;
  }

  /** Record a payment amount into the rolling window */
  record(amount: string): void {
    this.window.push(amount);
    if (this.window.length > this.windowSize) {
      this.window.shift();
    }
  }

  /**
   * Check if a proposed amount is a spike relative to the rolling average.
   * Returns null if no spike, or a description string if spike detected.
   * Needs at least 3 data points before spike detection activates.
   */
  check(amount: string): string | null {
    if (this.window.length < 3) return null;

    const avg = calculateAverage(this.window);
    const avgRaw = parseUSDC(avg);
    if (avgRaw === 0n) return null;

    const amountRaw = parseUSDC(amount);
    const ratio = Number(amountRaw) / Number(avgRaw);

    if (ratio > this.threshold) {
      return (
        `Payment $${amount} is ${ratio.toFixed(1)}x the rolling average ` +
        `$${formatUSDC(avgRaw)} (threshold: ${this.threshold}x)`
      );
    }
    return null;
  }

  /** Get the current rolling average */
  getAverage(): string {
    return calculateAverage(this.window);
  }

  /** Get the current window contents */
  getWindow(): string[] {
    return [...this.window];
  }

  /** Restore state from serialized data */
  loadWindow(amounts: string[]): void {
    this.window.length = 0;
    for (const a of amounts.slice(-this.windowSize)) {
      this.window.push(a);
    }
  }
}
