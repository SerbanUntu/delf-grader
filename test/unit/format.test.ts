import { describe, expect, test } from "vitest";
import {
  defaultSessionName,
  formatDate,
  formatNumber,
  isIsoDate,
  parseIsoDate,
  toIsoDate,
} from "@/lib/format";

describe("toIsoDate", () => {
  test("shows the year, month and day separated by dashes", () => {
    expect(toIsoDate(new Date(1999, 11, 31))).toBe("1999-12-31");
  });

  test("pads single-digit months and days with a zero", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  test("uses the local day, even late in the evening", () => {
    expect(toIsoDate(new Date(2026, 9, 31, 23, 59))).toBe("2026-10-31");
  });
});

describe("parseIsoDate", () => {
  test("gives the date at local midnight", () => {
    expect(parseIsoDate("2026-01-05")).toEqual(new Date(2026, 0, 5));
  });

  test("gives an invalid date for a value that is not an ISO date", () => {
    expect(Number.isNaN(parseIsoDate("31/12/1999").getTime())).toBe(true);
  });
});

describe("isIsoDate", () => {
  test("accepts a real date", () => {
    expect(isIsoDate("2026-10-31")).toBe(true);
    expect(isIsoDate("2024-02-29")).toBe(true);
  });

  test("rejects days that do not exist", () => {
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2025-02-29")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
  });

  test("rejects other formats", () => {
    expect(isIsoDate("2026-1-5")).toBe(false);
    expect(isIsoDate("31/12/1999")).toBe(false);
    expect(isIsoDate("2026-10-31T00:00")).toBe(false);
    expect(isIsoDate("")).toBe(false);
  });
});

describe("defaultSessionName", () => {
  test("joins the class name and the exam date", () => {
    expect(defaultSessionName("Clasa a X-a B", "2026-10-31")).toBe(
      "Clasa a X-a B - 31/10/2026",
    );
  });

  test("ignores spaces around the class name", () => {
    expect(defaultSessionName("  Clasa a X-a B ", "2026-10-31")).toBe(
      "Clasa a X-a B - 31/10/2026",
    );
  });

  test("uses placeholders for the parts that are not filled in yet", () => {
    expect(defaultSessionName("", "2026-10-31")).toBe(
      "Clasa a IX-a Z - 31/10/2026",
    );
    expect(defaultSessionName("Clasa a X-a B", undefined)).toBe(
      "Clasa a X-a B - 31/12/1999",
    );
    expect(defaultSessionName("   ", undefined)).toBe(
      "Clasa a IX-a Z - 31/12/1999",
    );
  });
});

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

  test("accepts an ISO date", () => {
    expect(formatDate("1999-12-31")).toBe("31/12/1999");
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
