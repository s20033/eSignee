const csvEscape = (value: string) => `"${value.replace(/"/g, '""')}"`;

/** Builds a CSV string from a header row and data rows, quoting every cell. */
export const toCsv = (header: string[], rows: string[][]) =>
  [header, ...rows].map((row) => row.map((value) => csvEscape(value)).join(",")).join("\n");
