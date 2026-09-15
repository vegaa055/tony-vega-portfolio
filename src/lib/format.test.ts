import { describe, expect, it } from "vitest";

import {
  catalogNumber,
  formatDate,
  isoDate,
  readingMinutes,
  yearOf,
} from "./format";

describe("formatDate", () => {
  it("formats a date for display", () => {
    expect(formatDate(new Date("2026-09-14T12:00:00Z"))).toBe("Sep 14, 2026");
  });

  it("uses UTC, so the day doesn't depend on the server's time zone", () => {
    // 11:30 PM in Arizona is already the next day in UTC.
    expect(formatDate(new Date("2026-09-14T23:30:00-07:00"))).toBe(
      "Sep 15, 2026",
    );
  });
});

describe("isoDate and yearOf", () => {
  it("returns the calendar date for <time dateTime>", () => {
    expect(isoDate(new Date("2026-09-14T12:00:00Z"))).toBe("2026-09-14");
  });

  it("returns the year, or null without a date", () => {
    expect(yearOf(new Date("2026-01-01T00:00:00Z"))).toBe("2026");
    expect(yearOf(null)).toBeNull();
  });
});

describe("readingMinutes", () => {
  const words = (count: number) => Array(count).fill("word").join(" ");

  it("never says less than a minute", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes(words(20))).toBe(1);
  });

  it("rounds to the nearest minute at 230 words a minute", () => {
    expect(readingMinutes(words(345))).toBe(2);
    expect(readingMinutes(words(690))).toBe(3);
  });
});

describe("catalogNumber", () => {
  it("pads to two digits", () => {
    expect(catalogNumber(1)).toBe("01");
    expect(catalogNumber(12)).toBe("12");
  });
});
