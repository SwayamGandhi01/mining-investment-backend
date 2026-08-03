import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import CompanyRegistration from "@/models/CompanyRegistration";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";
import { companyRegistrationSchema } from "@/lib/validations/companyRegistration";
import { formatZodErrors } from "@/lib/validators";
import { isValidObjectId } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/company-registrations/[id]
 * Fetch a single company registration by id or registration number.
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

    const registration = await CompanyRegistration.findOne({
      ...query,
      isDeleted: { $ne: true },
    }).lean();
    if (!registration)
      return errorResponse("Company registration not found", 404);

    return successResponse(registration);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/company-registrations/[id]
 * Replace a company registration — admin only.
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
    const validation = companyRegistrationSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
    }

    const registration = await CompanyRegistration.findByIdAndUpdate(
      id,
      validation.data,
      { new: true }
    );
    if (!registration || registration.isDeleted)
      return errorResponse("Company registration not found", 404);

    return successResponse(registration, "Company registration updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/company-registrations/[id]
 * Partially update a company registration — admin only.
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
    const registration = await CompanyRegistration.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!registration || registration.isDeleted)
      return errorResponse("Company registration not found", 404);

    return successResponse(registration, "Company registration updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/company-registrations/[id]
 * Permanently delete a company registration — admin only.
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

    const registration = await CompanyRegistration.findByIdAndDelete(id);
    if (!registration)
      return errorResponse("Company registration not found", 404);

    return successResponse(null, "Company registration deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
