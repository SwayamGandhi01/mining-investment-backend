import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Registration from "@/models/Registration";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";
import { registrationSchema } from "@/lib/validations/registration";
import { formatZodErrors } from "@/lib/validators";
import { isValidObjectId } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const query = isValidObjectId(id) ? { _id: id } : { registrationNumber: id };

    const registration = await Registration.findOne({ ...query, isDeleted: false }).populate("event", "title slug startDate venue").lean();
    if (!registration) return errorResponse("Registration record not found", 404);

    return successResponse(registration);
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
    const validation = registrationSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
    }

    const registration = await Registration.findByIdAndUpdate(id, validation.data, { new: true });
    if (!registration || registration.isDeleted) return errorResponse("Registration not found", 404);

    return successResponse(registration, "Registration record updated successfully");
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
    const registration = await Registration.findByIdAndUpdate(id, body, { new: true });
    if (!registration || registration.isDeleted) return errorResponse("Registration not found", 404);

    return successResponse(registration, "Registration updated successfully");
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

    const registration = await Registration.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!registration) return errorResponse("Registration not found", 404);

    return successResponse(null, "Registration deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
