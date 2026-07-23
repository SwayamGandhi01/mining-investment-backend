import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Speaker from "@/models/Speaker";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";
import { speakerSchema } from "@/lib/validations/speaker";
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

    const speaker = await Speaker.findOne({ ...query, isDeleted: false }).lean();
    if (!speaker) return errorResponse("Speaker not found", 404);

    return successResponse(speaker);
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
    const validation = speakerSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
    }

    const speaker = await Speaker.findById(id);
    if (!speaker || speaker.isDeleted) return errorResponse("Speaker not found", 404);

    let slug = speaker.slug;
    if (validation.data.name !== speaker.name) {
      slug = await ensureUniqueSlug(generateSlug(validation.data.name), "Speaker", id);
    }

    Object.assign(speaker, validation.data, { slug });
    await speaker.save();

    return successResponse(speaker, "Speaker updated successfully");
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
    const speaker = await Speaker.findByIdAndUpdate(id, body, { new: true });
    if (!speaker || speaker.isDeleted) return errorResponse("Speaker not found", 404);

    return successResponse(speaker, "Speaker updated successfully");
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

    const speaker = await Speaker.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!speaker) return errorResponse("Speaker not found", 404);

    return successResponse(null, "Speaker deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
