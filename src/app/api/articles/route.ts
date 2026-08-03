import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";
import {
  getPaginationParams,
  buildSortQuery,
  buildSearchQuery,
  buildFilterQuery,
  getSkip,
} from "@/lib/pagination";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  handleApiError,
} from "@/lib/response";
import { articleSchema } from "@/lib/validations/article";
import { formatZodErrors } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/articles
 * List articles — public. Newest first by default.
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const params = getPaginationParams(request);
    const filter = buildFilterQuery(
      params,
      buildSearchQuery(params.search, ["title", "description"])
    );
    const sort = buildSortQuery(params);
    const skip = getSkip(params.page, params.limit);

    const [data, total] = await Promise.all([
      Article.find(filter).sort(sort).skip(skip).limit(params.limit).lean(),
      Article.countDocuments(filter),
    ]);

    return paginatedResponse(
      data,
      total,
      params.page,
      params.limit,
      "Articles retrieved successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/articles
 * Create an article — admin only. Accepts a single object or an array.
 * Upload the cover image via POST /api/upload and the PDF via POST /api/upload-pdf
 * first, then send the returned urls here.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    await dbConnect();

    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      return errorResponse("At least one article entry is required", 400);
    }

    const createdArticles = [];

    for (const item of items) {
      const validation = articleSchema.safeParse(item);

      if (!validation.success) {
        return errorResponse(
          "Validation failed",
          400,
          formatZodErrors(validation.error)
        );
      }

      const slug = await ensureUniqueSlug(
        generateSlug(validation.data.title),
        "Article"
      );

      const newArticle = await Article.create({
        ...validation.data,
        slug,
      });

      createdArticles.push(newArticle);
    }

    return successResponse(
      Array.isArray(body) ? createdArticles : createdArticles[0],
      Array.isArray(body)
        ? "Articles created successfully"
        : "Article created successfully",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
