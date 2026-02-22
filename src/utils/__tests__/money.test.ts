import { describe, it, expect } from "vitest";
import {
  parseUSDC,
  formatUSDC,
  formatUSDCHuman,
  addUSDC,
  subtractUSDC,
  compareUSDC,
  isOverBudget,
  calculateAverage,
} from "../money";

describe("parseUSDC", () => {
  it("parses whole numbers", () => {
    expect(parseUSDC("1")).toBe(1_000_000n);
    expect(parseUSDC("100")).toBe(100_000_000n);
    expect(parseUSDC("0")).toBe(0n);
  });

  it("parses decimal amounts", () => {
    expect(parseUSDC("1.50")).toBe(1_500_000n);
    expect(parseUSDC("0.01")).toBe(10_000n);
    expect(parseUSDC("1.123456")).toBe(1_123_456n);
  });

  it("parses smallest unit (micropayment)", () => {
    expect(parseUSDC("0.000001")).toBe(1n);
  });

  it("parses large amounts", () => {
    expect(parseUSDC("999999.999999")).toBe(999_999_999_999n);
  });

  it("handles leading/trailing whitespace", () => {
    expect(parseUSDC("  1.00  ")).toBe(1_000_000n);
  });

  it("handles .5 (no leading zero)", () => {
    expect(parseUSDC(".5")).toBe(500_000n);
  });

  it("throws on empty string", () => {
    expect(() => parseUSDC("")).toThrow("Cannot parse empty string");
  });

  it("throws on negative amounts", () => {
    expect(() => parseUSDC("-1.00")).toThrow("Negative USDC amounts");
  });

  it("throws on too many decimals", () => {
    expect(() => parseUSDC("1.0000001")).toThrow("exceeds 6 decimal places");
  });
});

describe("formatUSDC", () => {
  it("formats to 6 decimal places", () => {
    expect(formatUSDC(1_500_000n)).toBe("1.500000");
    expect(formatUSDC(0n)).toBe("0.000000");
    expect(formatUSDC(1n)).toBe("0.000001");
    expect(formatUSDC(999_999_999_999n)).toBe("999999.999999");
  });
});

describe("formatUSDCHuman", () => {
  it("trims trailing zeros but keeps at least 2 decimals", () => {
    expect(formatUSDCHuman(1_500_000n)).toBe("1.50");
    expect(formatUSDCHuman(1_000_000n)).toBe("1.00");
    expect(formatUSDCHuman(1_123_456n)).toBe("1.123456");
    expect(formatUSDCHuman(0n)).toBe("0.00");
    expect(formatUSDCHuman(1n)).toBe("0.000001");
    expect(formatUSDCHuman(10n)).toBe("0.00001");
  });
});

describe("addUSDC", () => {
  it("adds two amounts", () => {
    expect(addUSDC("1.50", "2.25")).toBe("3.750000");
    expect(addUSDC("0.000001", "0.000001")).toBe("0.000002");
  });

  it("handles zero", () => {
    expect(addUSDC("5.00", "0")).toBe("5.000000");
  });
});

describe("subtractUSDC", () => {
  it("subtracts two amounts", () => {
    expect(subtractUSDC("5.00", "2.25")).toBe("2.750000");
  });

  it("allows negative results (internal use)", () => {
    expect(subtractUSDC("1.00", "2.00")).toBe("-1.000000");
  });
});

describe("compareUSDC", () => {
  it("returns correct comparison", () => {
    expect(compareUSDC("1.00", "2.00")).toBe(-1);
    expect(compareUSDC("2.00", "1.00")).toBe(1);
    expect(compareUSDC("1.50", "1.50")).toBe(0);
    expect(compareUSDC("0.000001", "0.000001")).toBe(0);
  });
});

describe("isOverBudget", () => {
  it("detects over-budget", () => {
    expect(isOverBudget("5.01", "5.00")).toBe(true);
    expect(isOverBudget("5.00", "5.00")).toBe(false);
    expect(isOverBudget("4.99", "5.00")).toBe(false);
  });
});

describe("calculateAverage", () => {
  it("calculates average of amounts", () => {
    expect(calculateAverage(["1.00", "2.00", "3.00"])).toBe("2.000000");
    expect(calculateAverage(["0.10", "0.20"])).toBe("0.150000");
  });

  it("returns zero for empty array", () => {
    expect(calculateAverage([])).toBe("0.000000");
  });

  it("handles single element", () => {
    expect(calculateAverage(["5.50"])).toBe("5.500000");
  });

  it("handles micropayments", () => {
    expect(calculateAverage(["0.000001", "0.000003"])).toBe("0.000002");
  });
});
