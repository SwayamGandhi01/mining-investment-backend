import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import StudentSponsorship from "@/models/StudentSponsorship";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";
import { studentSponsorshipSchema } from "@/lib/validations/studentSponsorship";
import { formatZodErrors } from "@/lib/validators";
import { isValidObjectId } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/student-sponsorships/[id]
 * Fetch a single student sponsorship by id or reference number.
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

    const sponsorship = await StudentSponsorship.findOne({
      ...query,
      isDeleted: { $ne: true },
    }).lean();
    if (!sponsorship)
      return errorResponse("Student sponsorship not found", 404);

    return successResponse(sponsorship);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/student-sponsorships/[id]
 * Replace a student sponsorship — admin only.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;
    if (!isValidObjectId(id)) return errorResponse("Invalid sponsorship id", 400);

    const body = await request.json();
    const validation = studentSponsorshipSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Validation failed",
        400,
        formatZodErrors(validation.error)
      );
    }

    const sponsorship = await StudentSponsorship.findByIdAndUpdate(
      id,
      validation.data,
      { new: true }
    );
    if (!sponsorship || sponsorship.isDeleted)
      return errorResponse("Student sponsorship not found", 404);

    return successResponse(sponsorship, "Student sponsorship updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/student-sponsorships/[id]
 * Partially update a student sponsorship — admin only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;
    if (!isValidObjectId(id)) return errorResponse("Invalid sponsorship id", 400);

    const body = await request.json();
    const sponsorship = await StudentSponsorship.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!sponsorship || sponsorship.isDeleted)
      return errorResponse("Student sponsorship not found", 404);

    return successResponse(sponsorship, "Student sponsorship updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/student-sponsorships/[id]
 * Permanently delete a student sponsorship — admin only.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;
    if (!isValidObjectId(id)) return errorResponse("Invalid sponsorship id", 400);

    const sponsorship = await StudentSponsorship.findByIdAndDelete(id);
    if (!sponsorship)
      return errorResponse("Student sponsorship not found", 404);

    return successResponse(null, "Student sponsorship deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
