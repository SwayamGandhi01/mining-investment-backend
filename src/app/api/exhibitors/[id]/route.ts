import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Exhibitor from "@/models/Exhibitor";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";
import { exhibitorSchema } from "@/lib/validations/exhibitor";
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

    const exhibitor = await Exhibitor.findOne({ ...query, isDeleted: false }).lean();
    if (!exhibitor) return errorResponse("Exhibitor not found", 404);

    return successResponse(exhibitor);
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
    const validation = exhibitorSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
    }

    const exhibitor = await Exhibitor.findById(id);
    if (!exhibitor || exhibitor.isDeleted) return errorResponse("Exhibitor not found", 404);

    let slug = exhibitor.slug;
    if (validation.data.name !== exhibitor.name) {
      slug = await ensureUniqueSlug(generateSlug(validation.data.name), "Exhibitor", id);
    }

    Object.assign(exhibitor, validation.data, { slug });
    await exhibitor.save();

    return successResponse(exhibitor, "Exhibitor updated successfully");
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
    const exhibitor = await Exhibitor.findByIdAndUpdate(id, body, { new: true });
    if (!exhibitor || exhibitor.isDeleted) return errorResponse("Exhibitor not found", 404);

    return successResponse(exhibitor, "Exhibitor updated successfully");
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

    const exhibitor = await Exhibitor.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!exhibitor) return errorResponse("Exhibitor not found", 404);

    return successResponse(null, "Exhibitor deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
