import mongoose from "mongoose";

/**
 * Generate a URL-friendly slug from a string.
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^\w-]+/g, "") // Remove non-word characters
    .replace(/--+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+/, "") // Trim hyphens from start
    .replace(/-+$/, ""); // Trim hyphens from end
}

/**
 * Ensure a slug is unique in the given collection.
 * Appends a numeric suffix if the slug already exists.
 * @param slug - The base slug to check
 * @param modelName - The Mongoose model name (e.g., "Event", "Blog")
 * @param excludeId - Optional ID to exclude (for updates)
 */
export async function ensureUniqueSlug(
  slug: string,
  modelName: string,
  excludeId?: string
): Promise<string> {
  const Model = mongoose.models[modelName];
  if (!Model) {
    throw new Error(`Model "${modelName}" not found`);
  }

  let uniqueSlug = slug;
  let counter = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query: Record<string, unknown> = { slug: uniqueSlug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Model.findOne(query).lean();
    if (!existing) {
      break;
    }

    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}
