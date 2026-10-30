import { describe, expect, test } from "vitest";
import { formatDate, formatNumber } from "@/lib/format";

describe("formatDate", () => {
  test("shows the day, month and year separated by slashes", () => {
    expect(formatDate(new Date(1999, 11, 31))).toBe("31/12/1999");
  });

  test("pads single-digit days and months with a zero", () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe("05/01/2026");
  });

  test("accepts a timestamp in milliseconds", () => {
    expect(formatDate(new Date(2026, 9, 30).getTime())).toBe("30/10/2026");
  });
});

describe("formatNumber", () => {
  test("uses a decimal point", () => {
    expect(formatNumber(17.5)).toBe("17.5");
  });

  test("leaves out trailing zeros", () => {
    expect(formatNumber(17)).toBe("17");
    expect(formatNumber(2.5)).toBe("2.5");
  });

  test("keeps at most two decimals by default", () => {
    expect(formatNumber(1.3333)).toBe("1.33");
  });

  test("keeps at most the given number of decimals", () => {
    expect(formatNumber(16.66, 1)).toBe("16.7");
    expect(formatNumber(16.66, 0)).toBe("17");
  });

  test("does not group thousands", () => {
    expect(formatNumber(1234.5)).toBe("1234.5");
  });

  test("shows negative numbers with a minus sign", () => {
    expect(formatNumber(-1.5)).toBe("-1.5");
  });
});
