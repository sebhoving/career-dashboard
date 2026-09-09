"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "dashboard-theme";

export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = stored ? stored === "dark" : prefers;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }, []);

  const toggle = useCallback(() => {
    setDark((current) => {
      const next = !current;
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem(KEY, next ? "dark" : "light");
      return next;
    });
  }, []);

  return { dark, toggle };
}
