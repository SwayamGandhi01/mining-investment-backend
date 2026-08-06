/**
 * Ordering helpers for the interactive agenda.
 *
 * Sessions are added in whatever order an admin happens to click "Add Session",
 * but they must read chronologically wherever they are displayed. Everything here
 * sorts by the session's start time rather than by insertion order.
 */

export interface AgendaItem {
  time?: string;
  title?: string;
  description?: string;
  speaker?: string;
  location?: string;
}

export interface AgendaDay {
  day?: string;
  date?: string;
  items?: AgendaItem[];
}

/** First clock reading in the string — "5:45 PM - 6:00 PM" yields the 5:45 PM. */
const TIME_PATTERN = /(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i;

/**
 * Convert a free-text session time to minutes past midnight.
 * Handles "6:30 PM", "6 PM", "18:30" and ranges like "5:45 PM - 6:00 PM".
 * Returns null for anything without a usable time ("TBD", "", undefined),
 * which the sorters push to the end rather than guessing at.
 */
export function parseAgendaTime(raw?: string | null): number | null {
  if (raw === null || raw === undefined) return null;

  const text = String(raw).trim();
  if (!text) return null;

  const match = TIME_PATTERN.exec(text);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3] ? match[3].toLowerCase().replace(/\./g, "") : null;

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (minutes > 59) return null;

  if (meridiem === "pm" && hours < 12) hours += 12;
  else if (meridiem === "am" && hours === 12) hours = 0;

  if (hours > 23) return null;

  return hours * 60 + minutes;
}

/**
 * Sort one day's sessions by start time. The sort is stable: sessions sharing a
 * time, and untimed sessions, keep the order the admin entered them in.
 */
export function sortAgendaItems<T extends AgendaItem>(items: T[]): T[] {
  if (!Array.isArray(items)) return items;

  return items
    .map((item, index) => ({ item, index, minutes: parseAgendaTime(item?.time) }))
    .sort((a, b) => {
      if (a.minutes === null && b.minutes === null) return a.index - b.index;
      if (a.minutes === null) return 1;
      if (b.minutes === null) return -1;
      if (a.minutes !== b.minutes) return a.minutes - b.minutes;
      return a.index - b.index;
    })
    .map((entry) => entry.item);
}

/**
 * Sort every day's sessions chronologically. Day order is left untouched —
 * days are sequenced by the admin, only the sessions inside them are reordered.
 */
export function sortAgendaDays<T extends AgendaDay>(days: T[]): T[] {
  if (!Array.isArray(days)) return days;

  return days.map((day) =>
    day && Array.isArray(day.items) ? { ...day, items: sortAgendaItems(day.items) } : day
  );
}

const hasText = (value?: string): boolean =>
  typeof value === "string" && value.trim().length > 0;

/** A session the admin never filled in — every field blank. */
export function isBlankAgendaItem(item?: AgendaItem): boolean {
  if (!item) return true;
  return (
    !hasText(item.time) &&
    !hasText(item.title) &&
    !hasText(item.speaker) &&
    !hasText(item.location) &&
    !hasText(item.description)
  );
}

/**
 * Drop untouched sessions and days.
 *
 * The create form starts with one empty day and session so the editor is
 * immediately usable. Those placeholders must not reach the database, where
 * `time` and `title` are required and would fail validation on an otherwise
 * valid event. A day is kept if it has a title, a date, or any real session.
 */
export function pruneAgendaDays<T extends AgendaDay>(days: T[]): T[] {
  if (!Array.isArray(days)) return days;

  return days
    .map((day) => ({
      ...day,
      items: (day?.items ?? []).filter((item) => !isBlankAgendaItem(item)),
    }))
    .filter((day) => hasText(day.day) || hasText(day.date) || day.items.length > 0);
}

/**
 * Sort the agenda arrays on an event-shaped object, leaving the rest as-is.
 * Safe to call on payloads that carry neither field.
 */
export function sortEventAgendas<T>(event: T): T {
  if (!event || typeof event !== "object") return event;

  const next: Record<string, unknown> = { ...(event as Record<string, unknown>) };

  if (Array.isArray(next.agenda)) {
    next.agenda = sortAgendaDays(next.agenda as AgendaDay[]);
  }
  if (Array.isArray(next.interactiveAgenda)) {
    next.interactiveAgenda = sortAgendaDays(next.interactiveAgenda as AgendaDay[]);
  }

  return next as T;
}

/**
 * Write-path counterpart to {@link sortEventAgendas}: strips placeholder rows
 * first, then sorts. Use this for anything being persisted; use the sort-only
 * version for reads, which should never drop stored data.
 */
export function cleanEventAgendas<T>(event: T): T {
  if (!event || typeof event !== "object") return event;

  const next: Record<string, unknown> = { ...(event as Record<string, unknown>) };

  if (Array.isArray(next.agenda)) {
    next.agenda = sortAgendaDays(pruneAgendaDays(next.agenda as AgendaDay[]));
  }
  if (Array.isArray(next.interactiveAgenda)) {
    next.interactiveAgenda = sortAgendaDays(
      pruneAgendaDays(next.interactiveAgenda as AgendaDay[])
    );
  }

  return next as T;
}
