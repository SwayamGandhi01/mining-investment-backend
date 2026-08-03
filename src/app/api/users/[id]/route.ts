import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";
import { userSchema } from "@/lib/validations/user";
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
    const query = isValidObjectId(id) ? { _id: id } : { email: id };

    const user = await User.findOne({ ...query, isDeleted: false }).lean();
    if (!user) return errorResponse("User not found", 404);

    return successResponse(user);
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
    const validation = userSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
    }

    const user = await User.findByIdAndUpdate(id, validation.data, { new: true });
    if (!user || user.isDeleted) return errorResponse("User not found", 404);

    return successResponse(user, "User updated successfully");
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
    const user = await User.findByIdAndUpdate(id, body, { new: true });
    if (!user || user.isDeleted) return errorResponse("User not found", 404);

    return successResponse(user, "User updated successfully");
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

    const user = await User.findByIdAndDelete(id);
    if (!user) return errorResponse("User not found", 404);

    return successResponse(null, "User deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
