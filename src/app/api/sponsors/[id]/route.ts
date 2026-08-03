import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Sponsor from "@/models/Sponsor";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";
import { sponsorSchema } from "@/lib/validations/sponsor";
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

    const sponsor = await Sponsor.findOne({ ...query, isDeleted: false }).lean();
    if (!sponsor) return errorResponse("Sponsor not found", 404);

    return successResponse(sponsor);
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
    const validation = sponsorSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
    }

    const sponsor = await Sponsor.findById(id);
    if (!sponsor || sponsor.isDeleted) return errorResponse("Sponsor not found", 404);

    let slug = sponsor.slug;
    if (validation.data.name !== sponsor.name) {
      slug = await ensureUniqueSlug(generateSlug(validation.data.name), "Sponsor", id);
    }

    Object.assign(sponsor, validation.data, { slug });
    await sponsor.save();

    return successResponse(sponsor, "Sponsor updated successfully");
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
    const sponsor = await Sponsor.findByIdAndUpdate(id, body, { new: true });
    if (!sponsor || sponsor.isDeleted) return errorResponse("Sponsor not found", 404);

    return successResponse(sponsor, "Sponsor updated successfully");
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

    const sponsor = await Sponsor.findByIdAndDelete(id);
    if (!sponsor) return errorResponse("Sponsor not found", 404);

    return successResponse(null, "Sponsor deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
