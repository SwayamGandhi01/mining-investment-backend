import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import LatestNews from "@/models/LatestNews";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/response";
import { latestNewsSchema } from "@/lib/validations/latestNews";
import { formatZodErrors } from "@/lib/validators";
import { isValidObjectId } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";

async function resolveParams(params: { id: string } | Promise<{ id: string }>) {
  const resolved =
    typeof params === "object" && "then" in params
      ? await params
      : params;
  return resolved?.id ?? undefined;
}

/**
 * GET /api/latest-news/[id]
 * Fetch single latest news item by ID or slug (public).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const id = await resolveParams(params);
    if (!id) return errorResponse("Missing latest news ID", 400);
    const query = isValidObjectId(id) ? { _id: id } : { slug: id };

    const item = await LatestNews.findOne({ ...query, isDeleted: false }).lean();
    if (!item) return errorResponse("Latest news item not found", 404);

    LatestNews.updateOne({ _id: item._id }, { $inc: { views: 1 } }).exec();

    return successResponse(item);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/latest-news/[id]
 * Full update of latest news item (admin protected).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const id = await resolveParams(params);
    if (!id) return errorResponse("Missing latest news ID", 400);

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
      const hasPdf =
        body?.pdfAttachment &&
        typeof body.pdfAttachment.url === "string" &&
        body.pdfAttachment.url.trim().length > 0;

      if (hasPdf) {
        const itemFallback = await LatestNews.findById(id);
        if (!itemFallback || itemFallback.isDeleted)
          return errorResponse("Latest news item not found", 404);

        let slug = itemFallback.slug;
        if (body.title && body.title !== itemFallback.title) {
          slug = await ensureUniqueSlug(
            generateSlug(body.title),
            "LatestNews",
            id
          );
        }

        if (!body.content || typeof body.content !== "string") {
          body.content = "";
        }

        Object.assign(itemFallback, body, { slug });
        await itemFallback.save();

        return successResponse(itemFallback, "Latest news item updated successfully");
      }

      return errorResponse(
        "Validation failed",
        400,
        formatZodErrors(validation.error)
      );
    }

    const item = await LatestNews.findById(id);
    if (!item || item.isDeleted)
      return errorResponse("Latest news item not found", 404);

    let slug = item.slug;
    if (validation.data.title !== item.title) {
      slug = await ensureUniqueSlug(
        generateSlug(validation.data.title),
        "LatestNews",
        id
      );
    }

    Object.assign(item, validation.data, { slug });
    await item.save();

    return successResponse(item, "Latest news item updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/latest-news/[id]
 * Partial update of latest news item (admin protected).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const id = await resolveParams(params);
    if (!id) return errorResponse("Missing latest news ID", 400);

    const body = await request.json();
    const item = await LatestNews.findByIdAndUpdate(id, body, { new: true });
    if (!item || item.isDeleted)
      return errorResponse("Latest news item not found", 404);

    return successResponse(item, "Latest news item updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/latest-news/[id]
 * Permanently delete latest news item (admin protected).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const id = await resolveParams(params);
    if (!id) return errorResponse("Missing latest news ID", 400);

    const item = await LatestNews.findByIdAndDelete(id);
    if (!item) return errorResponse("Latest news item not found", 404);

    return successResponse(null, "Latest news item deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
