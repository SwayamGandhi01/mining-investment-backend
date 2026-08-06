import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import LatestNews from "@/models/LatestNews";
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
import { latestNewsSchema } from "@/lib/validations/latestNews";
import { formatZodErrors } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/latest-news
 * List latest news items (public).
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const params = getPaginationParams(request);
    const filter = buildFilterQuery(
      params,
      buildSearchQuery(params.search, ["title", "subheading", "content", "category"])
    );

    // ?category=Mining%20News — lets the website fetch one section at a time.
    const category = request.nextUrl.searchParams.get("category");
    if (category && category !== "all") {
      filter.category = category;
    }
    const sort = buildSortQuery(params);
    const skip = getSkip(params.page, params.limit);

    const [data, total] = await Promise.all([
      LatestNews.find(filter).sort(sort).skip(skip).limit(params.limit).lean(),
      LatestNews.countDocuments(filter),
    ]);

    return paginatedResponse(
      data,
      total,
      params.page,
      params.limit,
      "Latest news list retrieved successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/latest-news
 * Create a new latest news item (admin protected).
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    await dbConnect();

    const body = await request.json();
    if (
      body?.pdfAttachment &&
      typeof body.pdfAttachment.url === "string" &&
      !body.pdfAttachment.url.trim()
    ) {
      delete body.pdfAttachment;
    }

    const validation = latestNewsSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        "Validation failed",
        400,
        formatZodErrors(validation.error)
      );
    }

    const slug = await ensureUniqueSlug(
      generateSlug(validation.data.title),
      "LatestNews"
    );

    const newItem = await LatestNews.create({
      ...validation.data,
      slug,
    });

    return successResponse(newItem, "Latest news item created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
