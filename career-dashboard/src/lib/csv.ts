/** Minimal RFC 4180 writer. No dependency needed for a few thousand rows. */
function escape(value: unknown) {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; header: string }[],
) {
  const head = columns.map((c) => escape(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => escape(r[c.key])).join(",")).join("\n");
  return `${head}\n${body}`;
}

export function downloadCsv(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
