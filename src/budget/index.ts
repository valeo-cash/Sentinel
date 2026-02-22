import type { BudgetPolicy, BudgetState, BudgetViolation, BudgetEvaluation } from "../types/budget";
import type { PaymentContext } from "../types/index";
import { addUSDC, compareUSDC } from "../utils/money";
import { getHourStart, getDayStart } from "../utils/time";
import { SpikeDetector } from "./spike-detector";

/** Enforces budget policies by evaluating proposed payments against spending state */
export class BudgetManager {
  private state: BudgetState;
  private readonly policy: BudgetPolicy;
  private readonly spikeDetector: SpikeDetector;

  constructor(policy: BudgetPolicy) {
    this.policy = policy;
    this.spikeDetector = new SpikeDetector(
      policy.spikeThreshold ?? 3.0,
    );
    const now = Date.now();
    this.state = {
      totalSpent: "0.000000",
      hourlySpent: "0.000000",
      dailySpent: "0.000000",
      callCount: 0,
      lastReset: { hourly: getHourStart(now), daily: getDayStart(now) },
      rollingAverage: "0.000000",
      rollingWindow: [],
    };
  }

  /**
   * Evaluate a proposed payment against the budget policy.
   * Called BEFORE every payment. Returns allow/deny with reason.
   */
  evaluate(context: PaymentContext): BudgetEvaluation {
    this.maybeResetWindows();
    const warnings: string[] = [];

    // 1. Blocked endpoints (fast reject)
    if (this.policy.blockedEndpoints?.length) {
      for (const pattern of this.policy.blockedEndpoints) {
        if (endpointMatches(context.endpoint, pattern)) {
          return {
            allowed: false,
            violation: this.violation("blocked_endpoint", "0.000000", "0.000000", context),
          };
        }
      }
    }

    // 2. Allowed endpoints whitelist
    if (this.policy.allowedEndpoints?.length) {
      const matched = this.policy.allowedEndpoints.some((p) =>
        endpointMatches(context.endpoint, p),
      );
      if (!matched) {
        return {
          allowed: false,
          violation: this.violation("blocked_endpoint", "0.000000", "0.000000", context),
        };
      }
    }

    // 3. Per-call limit
    if (this.policy.maxPerCall) {
      if (compareUSDC(context.amount, this.policy.maxPerCall) > 0) {
        return {
          allowed: false,
          violation: this.violation("per_call", this.policy.maxPerCall, "0.000000", context),
        };
      }
    }

    // 4. Spike detection
    const spikeMsg = this.spikeDetector.check(context.amount);
    if (spikeMsg) {
      if (this.policy.spikeThreshold !== undefined) {
        return {
          allowed: false,
          violation: this.violation(
            "spike",
            this.spikeDetector.getAverage(),
            this.state.hourlySpent,
            context,
          ),
        };
      }
      warnings.push(spikeMsg);
    }

    // 5. Hourly rolling window
    if (this.policy.maxPerHour) {
      const projectedHourly = addUSDC(this.state.hourlySpent, context.amount);
      if (compareUSDC(projectedHourly, this.policy.maxPerHour) > 0) {
        return {
          allowed: false,
          violation: this.violation("hourly", this.policy.maxPerHour, this.state.hourlySpent, context),
        };
      }
    }

    // 6. Daily rolling window
    if (this.policy.maxPerDay) {
      const projectedDaily = addUSDC(this.state.dailySpent, context.amount);
      if (compareUSDC(projectedDaily, this.policy.maxPerDay) > 0) {
        return {
          allowed: false,
          violation: this.violation("daily", this.policy.maxPerDay, this.state.dailySpent, context),
        };
      }
    }

    // 7. Total lifetime cap
    if (this.policy.maxTotal) {
      const projectedTotal = addUSDC(this.state.totalSpent, context.amount);
      if (compareUSDC(projectedTotal, this.policy.maxTotal) > 0) {
        return {
          allowed: false,
          violation: this.violation("total", this.policy.maxTotal, this.state.totalSpent, context),
        };
      }
    }

    // 8. Approval threshold
    if (this.policy.requireApproval) {
      if (compareUSDC(context.amount, this.policy.requireApproval.above) > 0) {
        return {
          allowed: false,
          violation: this.violation(
            "approval_required",
            this.policy.requireApproval.above,
            this.state.totalSpent,
            context,
          ),
        };
      }
    }

    return { allowed: true, warnings };
  }

  /** Record a completed payment. Called AFTER payment succeeds. */
  record(amount: string, _endpoint: string): void {
    this.maybeResetWindows();
    this.state.totalSpent = addUSDC(this.state.totalSpent, amount);
    this.state.hourlySpent = addUSDC(this.state.hourlySpent, amount);
    this.state.dailySpent = addUSDC(this.state.dailySpent, amount);
    this.state.callCount++;
    this.spikeDetector.record(amount);
    this.state.rollingAverage = this.spikeDetector.getAverage();
    this.state.rollingWindow = this.spikeDetector.getWindow();
  }

  /** Get current budget state (for dashboard/debugging) */
  getState(): BudgetState {
    this.maybeResetWindows();
    return { ...this.state, rollingWindow: [...this.state.rollingWindow] };
  }

  /** Reset spending counters for a given scope */
  reset(scope: "hourly" | "daily" | "total"): void {
    const now = Date.now();
    switch (scope) {
      case "hourly":
        this.state.hourlySpent = "0.000000";
        this.state.lastReset.hourly = getHourStart(now);
        break;
      case "daily":
        this.state.dailySpent = "0.000000";
        this.state.lastReset.daily = getDayStart(now);
        break;
      case "total":
        this.state.totalSpent = "0.000000";
        this.state.hourlySpent = "0.000000";
        this.state.dailySpent = "0.000000";
        this.state.callCount = 0;
        break;
    }
  }

  /** Serialize state for persistence */
  serialize(): string {
    return JSON.stringify(this.state);
  }

  /** Restore a BudgetManager from serialized state */
  static deserialize(data: string, policy: BudgetPolicy): BudgetManager {
    const mgr = new BudgetManager(policy);
    const parsed = JSON.parse(data) as BudgetState;
    mgr.state = parsed;
    mgr.spikeDetector.loadWindow(parsed.rollingWindow);
    return mgr;
  }

  /** Auto-reset hourly/daily windows when the time window has rolled over */
  private maybeResetWindows(): void {
    const now = Date.now();
    const hourStart = getHourStart(now);
    const dayStart = getDayStart(now);

    if (hourStart > this.state.lastReset.hourly) {
      this.state.hourlySpent = "0.000000";
      this.state.lastReset.hourly = hourStart;
    }
    if (dayStart > this.state.lastReset.daily) {
      this.state.dailySpent = "0.000000";
      this.state.lastReset.daily = dayStart;
    }
  }

  private violation(
    type: BudgetViolation["type"],
    limit: string,
    current: string,
    context: PaymentContext,
  ): BudgetViolation {
    return {
      type,
      limit,
      current,
      attempted: context.amount,
      agentId: context.agentId,
      endpoint: context.endpoint,
      timestamp: Date.now(),
    };
  }
}

/** Simple glob-like endpoint matching (supports * wildcards) */
function endpointMatches(url: string, pattern: string): boolean {
  const regex = new RegExp(
    "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$",
  );
  return regex.test(url);
}

export { SpikeDetector } from "./spike-detector";
export {
  conservativePolicy,
  standardPolicy,
  liberalPolicy,
  unlimitedPolicy,
  customPolicy,
} from "./policies";
