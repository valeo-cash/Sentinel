export class BudgetLedger {
  private maxBudgetUsd: number;
  private reservedUsd = 0;
  private spentUsd = 0;
  private lockPromise: Promise<void> = Promise.resolve();

  constructor(maxBudgetUsd: number) {
    this.maxBudgetUsd = maxBudgetUsd;
  }

  async reserve(amountUsd: number): Promise<boolean> {
    let release!: () => void;
    const prev = this.lockPromise;
    this.lockPromise = new Promise<void>((r) => { release = r; });
    await prev;

    try {
      const committed = this.spentUsd + this.reservedUsd;
      const remaining = this.maxBudgetUsd - committed;
      if (amountUsd > remaining) return false;
      this.reservedUsd += amountUsd;
      return true;
    } finally {
      release();
    }
  }

  confirmSpend(amountUsd: number): void {
    this.reservedUsd = Math.max(0, this.reservedUsd - amountUsd);
    this.spentUsd += amountUsd;
  }

  releaseReservation(amountUsd: number): void {
    this.reservedUsd = Math.max(0, this.reservedUsd - amountUsd);
  }

  get remaining(): number {
    return this.maxBudgetUsd - (this.spentUsd + this.reservedUsd);
  }

  get totalSpent(): number {
    return this.spentUsd;
  }

  get totalReserved(): number {
    return this.reservedUsd;
  }
}
