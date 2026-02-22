import type { BudgetPolicy } from "../types/budget";

/** Tight limits for low-risk or testing scenarios */
export function conservativePolicy(): BudgetPolicy {
  return {
    maxPerCall: "0.10",
    maxPerHour: "5.00",
    maxPerDay: "50.00",
    spikeThreshold: 3.0,
  };
}

/** Balanced limits for typical production agents */
export function standardPolicy(): BudgetPolicy {
  return {
    maxPerCall: "1.00",
    maxPerHour: "25.00",
    maxPerDay: "200.00",
    spikeThreshold: 3.0,
  };
}

/** Higher limits for trusted, high-throughput agents */
export function liberalPolicy(): BudgetPolicy {
  return {
    maxPerCall: "10.00",
    maxPerHour: "100.00",
    maxPerDay: "1000.00",
    spikeThreshold: 5.0,
  };
}

/** No spending limits — audit logging only */
export function unlimitedPolicy(): BudgetPolicy {
  return {};
}

/** Build a custom policy by overriding defaults */
export function customPolicy(overrides: Partial<BudgetPolicy>): BudgetPolicy {
  return { ...standardPolicy(), ...overrides };
}
