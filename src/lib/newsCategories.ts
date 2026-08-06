/**
 * The news sections the website renders. Adding a section is a one-line change
 * here — the admin dropdown and the API filter both read from this list.
 */
export const NEWS_CATEGORIES = [
  "Mining News",
  "Oil & Gas News",
  "Governments",
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export const DEFAULT_NEWS_CATEGORY: NewsCategory = "Mining News";

/**
 * Options for the admin category dropdown.
 *
 * `current` keeps a value that predates this list (older items are tagged
 * "Latest News") selectable, so opening such an item for editing does not
 * silently retag it as the first option.
 */
export function newsCategoryOptions(
  current?: string
): Array<{ label: string; value: string }> {
  const values: string[] = [...NEWS_CATEGORIES];

  if (current && current.trim() && !values.includes(current)) {
    values.push(current);
  }

  return values.map((value) => ({ label: value, value }));
}
