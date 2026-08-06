import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Subscriber from "@/models/Subscriber";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";
import { subscriberSchema } from "@/lib/validations/subscriber";
import { formatZodErrors } from "@/lib/validators";
import { isValidObjectId } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/subscribers/[id]
 * Fetch a single subscriber by id or email address — admin only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;
    const query = isValidObjectId(id) ? { _id: id } : { email: id.toLowerCase() };

    const subscriber = await Subscriber.findOne({
      ...query,
      isDeleted: { $ne: true },
    }).lean();
    if (!subscriber) return errorResponse("Subscriber not found", 404);

    return successResponse(subscriber);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/subscribers/[id]
 * Replace a subscriber — admin only.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;
    if (!isValidObjectId(id)) return errorResponse("Invalid subscriber id", 400);

    const body = await request.json();
    const validation = subscriberSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Validation failed",
        400,
        formatZodErrors(validation.error)
      );
    }

    const subscriber = await Subscriber.findByIdAndUpdate(
      id,
      { ...validation.data, email: validation.data.email.toLowerCase() },
      { new: true, runValidators: true }
    );
    if (!subscriber || subscriber.isDeleted)
      return errorResponse("Subscriber not found", 404);

    return successResponse(subscriber, "Subscriber updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/subscribers/[id]
 * Partially update a subscriber — admin only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;
    if (!isValidObjectId(id)) return errorResponse("Invalid subscriber id", 400);

    const body = await request.json();
    const subscriber = await Subscriber.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!subscriber || subscriber.isDeleted)
      return errorResponse("Subscriber not found", 404);

    return successResponse(subscriber, "Subscriber updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/subscribers/[id]
 * Permanently remove a subscriber — admin only.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;
    if (!isValidObjectId(id)) return errorResponse("Invalid subscriber id", 400);

    const subscriber = await Subscriber.findByIdAndDelete(id);
    if (!subscriber) return errorResponse("Subscriber not found", 404);

    return successResponse(null, "Subscriber deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
