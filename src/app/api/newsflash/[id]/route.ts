import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Newsflash from "@/models/Newsflash";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/response";
import { newsflashSchema } from "@/lib/validations/newsflash";
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
 * GET /api/newsflash/[id]
 * Fetch single newsflash item by ID or slug (public).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const id = await resolveParams(params);
    if (!id) return errorResponse("Missing newsflash ID", 400);
    const query = isValidObjectId(id) ? { _id: id } : { slug: id };

    const item = await Newsflash.findOne({ ...query, isDeleted: false }).lean();
    if (!item) return errorResponse("Newsflash article not found", 404);

    // Increment view count asynchronously
    Newsflash.updateOne({ _id: item._id }, { $inc: { views: 1 } }).exec();

    return successResponse(item);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/newsflash/[id]
 * Full update of newsflash item (admin protected).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const id = await resolveParams(params);
    if (!id) return errorResponse("Missing newsflash ID", 400);

    const body = await request.json();
    const validation = newsflashSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Validation failed",
        400,
        formatZodErrors(validation.error)
      );
    }

    const item = await Newsflash.findById(id);
    if (!item || item.isDeleted)
      return errorResponse("Newsflash article not found", 404);

    let slug = item.slug;
    if (validation.data.title !== item.title) {
      slug = await ensureUniqueSlug(
        generateSlug(validation.data.title),
        "Newsflash",
        id
      );
    }

    Object.assign(item, validation.data, { slug });
    await item.save();

    return successResponse(item, "Newsflash article updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/newsflash/[id]
 * Partial update of newsflash item (e.g. status toggle) (admin protected).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const id = await resolveParams(params);
    if (!id) return errorResponse("Missing newsflash ID", 400);

    const body = await request.json();
    const item = await Newsflash.findByIdAndUpdate(id, body, { new: true });
    if (!item || item.isDeleted)
      return errorResponse("Newsflash article not found", 404);

    return successResponse(item, "Newsflash article updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/newsflash/[id]
 * Soft delete newsflash item (admin protected).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const id = await resolveParams(params);
    if (!id) return errorResponse("Missing newsflash ID", 400);

    const item = await Newsflash.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!item) return errorResponse("Newsflash article not found", 404);

    return successResponse(null, "Newsflash article deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
