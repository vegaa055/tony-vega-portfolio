// Formatting in UTC keeps a date from shifting a day between the server that
// prerendered the page and wherever it's being read.
const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "Sep 14, 2026" */
export function formatDate(date: Date) {
  return dateFormat.format(date);
}

/** "2026-09-14", for <time dateTime>. */
export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** "2026", or null when there's no date. */
export function yearOf(date: Date | null) {
  return date ? String(date.getUTCFullYear()) : null;
}

const WORDS_PER_MINUTE = 230;

/** Estimated reading time in whole minutes (at least 1). */
export function readingMinutes(markdown: string) {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Catalog number shown on project cards: 1 -> "01". */
export function catalogNumber(position: number) {
  return String(position).padStart(2, "0");
}
