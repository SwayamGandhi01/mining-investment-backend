import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Newsflash from "@/models/Newsflash";
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
import { newsflashSchema } from "@/lib/validations/newsflash";
import { formatZodErrors } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/newsflash
 * List newsflash items (public).
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const params = getPaginationParams(request);
    const filter = buildFilterQuery(
      params,
      buildSearchQuery(params.search, ["title", "subheading", "content", "category"])
    );
    const sort = buildSortQuery(params);
    const skip = getSkip(params.page, params.limit);

    const [data, total] = await Promise.all([
      Newsflash.find(filter).sort(sort).skip(skip).limit(params.limit).lean(),
      Newsflash.countDocuments(filter),
    ]);

    return paginatedResponse(
      data,
      total,
      params.page,
      params.limit,
      "Newsflash list retrieved successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/newsflash
 * Create a new newsflash item (protected admin only).
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    await dbConnect();

    const body = await request.json();
    // Normalize empty nested pdfAttachment fields coming from forms
    if (body?.pdfAttachment && typeof body.pdfAttachment.url === "string" && !body.pdfAttachment.url.trim()) {
      delete body.pdfAttachment;
    }
    const validation = newsflashSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Validation failed",
        400,
        formatZodErrors(validation.error)
      );
    }

    const slug = await ensureUniqueSlug(
      generateSlug(validation.data.title),
      "Newsflash"
    );

    const newItem = await Newsflash.create({
      ...validation.data,
      slug,
    });

    return successResponse(
      newItem,
      "Newsflash article created successfully",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
