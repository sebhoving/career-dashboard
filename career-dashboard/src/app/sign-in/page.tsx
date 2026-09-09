"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient, hasSupabase } from "@/lib/supabase";

function SignInForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(
    params.get("error") ? "That sign in link expired. Try again." : null,
  );
  const [busy, setBusy] = useState(false);

  const signInWithGithub = async () => {
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setStatus(error.message);
      setBusy(false);
    }
  };

  const signInWithEmail = async () => {
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    setStatus(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(error.message);
      setBusy(false);
      return;
    }
    window.location.assign(next);
  };

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-lg font-semibold tracking-[-0.01em] text-ink">Applied Scientist track</h1>
      <p className="mt-1 text-sm text-muted">
        Sign in to see the roadmap, the problem log and the application pipeline.
      </p>

      {!hasSupabase ? (
        <p className="mt-5 border border-line bg-surface px-3 py-2.5 text-micro text-muted">
          No Supabase project is configured, so the dashboard is running open on seed data. Add
          NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to switch sign in on.
        </p>
      ) : null}

      <Button
        variant="solid"
        className="mt-5 h-10 w-full"
        onClick={signInWithGithub}
        disabled={!hasSupabase || busy}
      >
        <Github size={15} />
        Continue with GitHub
      </Button>

      <div className="my-4 flex items-center gap-3 text-micro text-muted">
        <span className="h-px flex-1 bg-line" />
        or use email
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="space-y-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email"
          autoComplete="email"
          disabled={!hasSupabase}
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && signInWithEmail()}
          placeholder="Password"
          aria-label="Password"
          autoComplete="current-password"
          disabled={!hasSupabase}
        />
        <Button
          variant="outline"
          className="h-10 w-full"
          onClick={signInWithEmail}
          disabled={!hasSupabase || busy || !email || !password}
        >
          Sign in
        </Button>
      </div>

      {status ? (
        <p role="alert" className="mt-3 text-micro text-risk">
          {status}
        </p>
      ) : null}

      <p className="mt-6 text-micro text-muted">
        New accounts start as mentors with read access. Ask Sebastian to change the role in
        Supabase if you need to edit.
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </main>
  );
}
