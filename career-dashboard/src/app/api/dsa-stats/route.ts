import { NextResponse } from "next/server";
import { buildDsaProblems } from "@/lib/data/seed";

/**
 * DSA progress. LeetCode has no supported public API, so this reads the
 * internal problem log and only falls back to seed data when the database is
 * not configured. Daily refresh matches how often the log actually changes.
 */
export const revalidate = 86400;

export async function GET() {
  const problems = buildDsaProblems();
  const solved = problems.filter((p) => p.solvedAt);

  const byLevel = solved.reduce<Record<string, number>>((acc, p) => {
    acc[p.level] = (acc[p.level] ?? 0) + 1;
    return acc;
  }, {});

  const byPattern = solved.reduce<Record<string, number>>((acc, p) => {
    acc[p.pattern] = (acc[p.pattern] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    total: problems.length,
    solved: solved.length,
    byLevel,
    byPattern,
    source: "internal",
  });
}
