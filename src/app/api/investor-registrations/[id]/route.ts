import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import InvestorRegistration from "@/models/InvestorRegistration";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";
import { investorRegistrationSchema } from "@/lib/validations/investorRegistration";
import { formatZodErrors } from "@/lib/validators";
import { isValidObjectId } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/investor-registrations/[id]
 * Fetch a single investor registration by id or registration number.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;
    const query = isValidObjectId(id) ? { _id: id } : { registrationNumber: id };

    const registration = await InvestorRegistration.findOne({
      ...query,
      isDeleted: { $ne: true },
    }).lean();
    if (!registration)
      return errorResponse("Investor registration not found", 404);

    return successResponse(registration);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/investor-registrations/[id]
 * Replace an investor registration — admin only.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;
    if (!isValidObjectId(id)) return errorResponse("Invalid registration id", 400);

    const body = await request.json();
    const validation = investorRegistrationSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
    }

    const registration = await InvestorRegistration.findByIdAndUpdate(
      id,
      validation.data,
      { new: true }
    );
    if (!registration || registration.isDeleted)
      return errorResponse("Investor registration not found", 404);

    return successResponse(registration, "Investor registration updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/investor-registrations/[id]
 * Partially update an investor registration — admin only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;
    if (!isValidObjectId(id)) return errorResponse("Invalid registration id", 400);

    const body = await request.json();
    const registration = await InvestorRegistration.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!registration || registration.isDeleted)
      return errorResponse("Investor registration not found", 404);

    return successResponse(registration, "Investor registration updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/investor-registrations/[id]
 * Permanently delete an investor registration — admin only.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;
    if (!isValidObjectId(id)) return errorResponse("Invalid registration id", 400);

    const registration = await InvestorRegistration.findByIdAndDelete(id);
    if (!registration)
      return errorResponse("Investor registration not found", 404);

    return successResponse(null, "Investor registration deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
