import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

/**
 * The local calendar date as yyyy-MM-dd. Every date in the app is a plain
 * date string, and comparisons treat them as UTC midnight, so "today" has to
 * be the local day rather than the UTC one or evenings drift into tomorrow.
 */
export function todayIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const today = () => new Date(`${todayIso()}T00:00:00Z`);

export function daysBetween(a: string | Date, b: string | Date) {
  const x = typeof a === "string" ? new Date(a) : a;
  const y = typeof b === "string" ? new Date(b) : b;
  return Math.round((y.getTime() - x.getTime()) / 86400000);
}

/** 9 Sep, not 09/09/2026. Short dates read faster in a dense table. */
export function shortDate(d: string | Date | null) {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function longDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export function hours(minutes: number) {
  return Math.round((minutes / 60) * 10) / 10;
}

/**
 * Reduce a dense series to at most `target` points by averaging buckets.
 * Three years of daily rows is 1096 points; Recharts will draw them, but the
 * SVG path gets long enough to stutter on resize. Bucketing keeps the shape.
 */
export function downsample<T>(rows: T[], target: number, merge: (chunk: T[]) => T): T[] {
  if (rows.length <= target) return rows;
  const size = Math.ceil(rows.length / target);
  const out: T[] = [];
  for (let i = 0; i < rows.length; i += size) {
    out.push(merge(rows.slice(i, i + size)));
  }
  return out;
}
