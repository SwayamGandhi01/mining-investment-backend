import { z } from "zod";
import { ZodError } from "zod";

/**
 * Common Zod schemas reused across the application.
 */

// MongoDB ObjectId validation
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

// Slug validation
export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(200, "Slug must be 200 characters or less")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");

// Pagination query params
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.string().default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().default(""),
  status: z.string().optional(),
});

// Image file validation
export const imageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  publicId: z.string().min(1, "Image public ID is required"),
});

// SEO fields (reusable across models)
export const seoFieldsSchema = z.object({
  seoTitle: z.string().max(70, "SEO title must be 70 characters or less").optional(),
  seoDescription: z
    .string()
    .max(160, "SEO description must be 160 characters or less")
    .optional(),
  seoKeywords: z.string().max(500, "SEO keywords too long").optional(),
});

// Social links (reusable)
export const socialLinksSchema = z.object({
  facebook: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  instagram: z.string().url().optional().or(z.literal("")),
  youtube: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
});

// Email validation
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(255, "Email must be 255 characters or less");

// Password validation
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be 128 characters or less");

// Status enum (common across modules)
export const statusSchema = z.enum(["draft", "published", "archived"]);

/**
 * Parse and format Zod validation errors into a consistent structure.
 */
export function formatZodErrors(
  error: ZodError
): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

/**
 * Validate request body against a Zod schema.
 * Returns the validated data or throws a formatted error.
 */
export async function validateBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): Promise<T> {
  const result = schema.safeParse(body);

  if (!result.success) {
    const formattedErrors = formatZodErrors(result.error);
    const error = new Error("Validation failed") as Error & {
      validationErrors: Array<{ field: string; message: string }>;
    };
    error.validationErrors = formattedErrors;
    throw error;
  }

  return result.data;
}
