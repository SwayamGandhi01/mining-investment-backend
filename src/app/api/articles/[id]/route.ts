import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";
import { articleSchema } from "@/lib/validations/article";
import { formatZodErrors } from "@/lib/validators";
import { isValidObjectId } from "@/lib/utils";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/articles/[id]
 * Fetch a single article by id or slug — public.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const query = isValidObjectId(id) ? { _id: id } : { slug: id };

    const article = await Article.findOne({
      ...query,
      isDeleted: { $ne: true },
    }).lean();

    if (!article) {
      return errorResponse("Article not found", 404);
    }

    return successResponse(article);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/articles/[id]
 * Update an article — admin only. Retitling regenerates the slug.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;
    if (!isValidObjectId(id)) return errorResponse("Invalid article id", 400);

    const body = await request.json();
    const validation = articleSchema.partial().safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Validation failed",
        400,
        formatZodErrors(validation.error)
      );
    }

    const update: Record<string, unknown> = { ...validation.data };

    if (validation.data.title) {
      update.slug = await ensureUniqueSlug(
        generateSlug(validation.data.title),
        "Article",
        id
      );
    }

    const updated = await Article.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return errorResponse("Article not found", 404);
    }

    return successResponse(updated, "Article updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/articles/[id]
 * Partially update an article — admin only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;
    if (!isValidObjectId(id)) return errorResponse("Invalid article id", 400);

    const body = await request.json();
    const updated = await Article.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: body },
      { new: true }
    );

    if (!updated) {
      return errorResponse("Article not found", 404);
    }

    return successResponse(updated, "Article updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/articles/[id]
 * Permanently delete an article — admin only.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;
    if (!isValidObjectId(id)) return errorResponse("Invalid article id", 400);

    const deleted = await Article.findOneAndDelete({
      _id: id,
      isDeleted: { $ne: true },
    });

    if (!deleted) {
      return errorResponse("Article not found", 404);
    }

    return successResponse(null, "Article deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
