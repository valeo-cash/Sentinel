const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Check if a timestamp falls within `windowMs` milliseconds of now */
export function isWithinWindow(timestamp: number, windowMs: number, now?: number): boolean {
  const ref = now ?? Date.now();
  return ref - timestamp < windowMs;
}

/** Get the start of the current hour as a unix ms timestamp */
export function getHourStart(now?: number): number {
  const ref = now ?? Date.now();
  return ref - (ref % HOUR_MS);
}

/** Get the start of the current day (UTC) as a unix ms timestamp */
export function getDayStart(now?: number): number {
  const ref = now ?? Date.now();
  return ref - (ref % DAY_MS);
}

/** Format a unix ms timestamp as an ISO 8601 string */
export function formatTimestamp(ts: number): string {
  return new Date(ts).toISOString();
}

/** Resolve a named time range to epoch ms boundaries */
export function resolveTimeRange(
  range: "last_hour" | "last_day" | "last_week" | "last_month" | { start: number; end: number },
  now?: number,
): { start: number; end: number } {
  const ref = now ?? Date.now();
  if (typeof range === "object") return range;
  switch (range) {
    case "last_hour":
      return { start: ref - HOUR_MS, end: ref };
    case "last_day":
      return { start: ref - DAY_MS, end: ref };
    case "last_week":
      return { start: ref - 7 * DAY_MS, end: ref };
    case "last_month":
      return { start: ref - 30 * DAY_MS, end: ref };
  }
}
