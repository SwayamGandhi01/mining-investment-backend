import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Gallery from "@/models/Gallery";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";
import { gallerySchema } from "@/lib/validations/gallery";
import { formatZodErrors } from "@/lib/validators";
import { isValidObjectId } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const query = isValidObjectId(id) ? { _id: id } : { slug: id };

    const gallery = await Gallery.findOne({ ...query, isDeleted: false }).populate("event", "title slug").lean();
    if (!gallery) return errorResponse("Gallery not found", 404);

    return successResponse(gallery);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;

    const body = await request.json();
    const validation = gallerySchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
    }

    const gallery = await Gallery.findById(id);
    if (!gallery || gallery.isDeleted) return errorResponse("Gallery not found", 404);

    let slug = gallery.slug;
    if (validation.data.title !== gallery.title) {
      slug = await ensureUniqueSlug(generateSlug(validation.data.title), "Gallery", id);
    }

    Object.assign(gallery, validation.data, { slug });
    await gallery.save();

    return successResponse(gallery, "Gallery updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;

    const body = await request.json();
    const gallery = await Gallery.findByIdAndUpdate(id, body, { new: true });
    if (!gallery || gallery.isDeleted) return errorResponse("Gallery not found", 404);

    return successResponse(gallery, "Gallery updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;

    const gallery = await Gallery.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!gallery) return errorResponse("Gallery not found", 404);

    return successResponse(null, "Gallery deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
