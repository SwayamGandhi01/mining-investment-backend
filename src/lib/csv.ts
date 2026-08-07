/**
 * CSV export helpers for the admin list pages.
 */

export interface CsvColumn<T> {
  header: string;
  /** Pull the cell value out of a record. Return anything; it is stringified. */
  value: (row: T) => unknown;
}

/**
 * Characters that make Excel/Sheets treat a cell as a formula. These lists are
 * fed by public forms, so a subscriber could sign up as `=HYPERLINK(...)` and
 * have it execute when an admin opens the export. Prefixing with an apostrophe
 * makes the cell plain text.
 */
const FORMULA_TRIGGERS = ["=", "+", "-", "@", "\t", "\r"];

/**
 * International phone numbers ("+1 (416) 555-0199") start with a trigger
 * character but cannot carry a payload: a DDE/command injection needs `|`, `!`
 * or a function name, and none of those can appear here. Excepting them keeps
 * the visible apostrophe out of the Phone column without weakening the guard.
 */
const PHONE_LIKE = /^\+[\d\s().-]+$/;

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.join("; ");
  return String(value);
}

/** Escape one value into a CSV field. */
export function csvCell(value: unknown): string {
  let text = stringifyValue(value);

  if (text && FORMULA_TRIGGERS.includes(text[0]) && !PHONE_LIKE.test(text)) {
    text = `'${text}`;
  }

  // Quote when the value contains a delimiter, quote or newline; doubling any
  // embedded quotes is how RFC 4180 escapes them.
  if (/[",\n\r]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

/** Build a full CSV document (header row + data rows) from typed columns. */
export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [columns.map((c) => csvCell(c.header)).join(",")];

  for (const row of rows) {
    lines.push(columns.map((c) => csvCell(c.value(row))).join(","));
  }

  // CRLF is what RFC 4180 specifies and what Excel is happiest with.
  return lines.join("\r\n");
}

/** ISO-8601 timestamps: unambiguous across locales, and sortable as text. */
export function csvDate(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return isNaN(date.getTime()) ? "" : date.toISOString();
}

/**
 * Upper bound on rows in a single export, so one request cannot try to pull an
 * unbounded collection into memory. Well above any realistic list here; if it
 * is ever hit the response says so rather than truncating silently.
 */
export const EXPORT_ROW_CAP = 50000;

/**
 * Byte-order mark. Excel opens a UTF-8 CSV as the local ANSI codepage unless the
 * file starts with one, which turns "Zoë" into "ZoÃ«". Built from a char code
 * rather than written literally so there is no invisible character in the source.
 */
const UTF8_BOM = String.fromCharCode(0xfeff);

/**
 * Wrap a CSV document in a downloadable response.
 *
 * The leading BOM is what makes Excel read the file as UTF-8 — without it,
 * accented names arrive mangled.
 */
export function csvResponse(csv: string, baseName: string, rowCount?: number): Response {
  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `${baseName}-${stamp}.csv`;

  const headers: Record<string, string> = {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "private, no-store",
  };

  // Surfaced to the admin as a warning rather than handing over a short file
  // that looks complete.
  if (rowCount !== undefined && rowCount >= EXPORT_ROW_CAP) {
    headers["X-Export-Truncated"] = String(EXPORT_ROW_CAP);
  }

  return new Response(UTF8_BOM + csv, { status: 200, headers });
}
