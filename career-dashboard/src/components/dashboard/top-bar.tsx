"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/lib/store";
import { useTheme } from "@/lib/hooks/use-theme";
import { createClient, hasSupabase } from "@/lib/supabase";
import { TABS } from "@/lib/types";

export function TopBar() {
  const profile = useDashboard((s) => s.profile);
  const source = useDashboard((s) => s.source);
  const hydrated = useDashboard((s) => s.hydrated);
  const { dark, toggle } = useTheme();

  const status = !hydrated
    ? "Loading"
    : source === "seed"
      ? "Saved in this browser"
      : profile
        ? `Signed in as ${profile.name}`
        : "Signed in";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-[-0.01em] text-ink">
            Applied Scientist track
          </h1>
          <p className="text-micro text-muted">{status}</p>
        </div>

        <Tabs.List
          aria-label="Sections"
          className="order-last flex w-full gap-1 sm:order-none sm:w-auto"
        >
          {TABS.map((t) => (
            <Tabs.Trigger
              key={t.key}
              value={t.key}
              className="rounded px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink data-[state=active]:bg-ink data-[state=active]:text-paper"
            >
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="ml-auto flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggle}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </Button>

          {hasSupabase && profile ? (
            <Button
              size="icon"
              variant="ghost"
              aria-label="Sign out"
              onClick={async () => {
                await createClient()?.auth.signOut();
                window.location.assign("/sign-in");
              }}
            >
              <LogOut size={15} />
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
