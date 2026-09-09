import { NextResponse } from "next/server";

/**
 * GitHub commit activity. The token never reaches the client.
 * Cached for an hour, which matches the stated refresh frequency and keeps
 * the app well inside the unauthenticated rate limit even if the token is absent.
 */
export const revalidate = 3600;

interface PushEvent {
  type: string;
  created_at: string;
  payload?: { size?: number };
}

export async function GET() {
  const username = process.env.GITHUB_USERNAME;
  const token = process.env.GITHUB_TOKEN;

  if (!username) {
    return NextResponse.json(
      { commitsByDate: {}, source: "unconfigured" },
      { status: 200 },
    );
  }

  try {
    const res = await fetch(`https://api.github.com/users/${username}/events?per_page=100`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `GitHub responded ${res.status}`, commitsByDate: {} },
        { status: res.status === 403 ? 429 : 502 },
      );
    }

    const events = (await res.json()) as PushEvent[];
    const commitsByDate: Record<string, number> = {};

    for (const event of events) {
      if (event.type !== "PushEvent") continue;
      const day = event.created_at.slice(0, 10);
      commitsByDate[day] = (commitsByDate[day] ?? 0) + (event.payload?.size ?? 1);
    }

    return NextResponse.json({ commitsByDate, source: "github" });
  } catch {
    return NextResponse.json({ error: "GitHub unreachable", commitsByDate: {} }, { status: 502 });
  }
}
