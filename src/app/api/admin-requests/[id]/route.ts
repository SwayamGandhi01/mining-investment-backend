import { NextRequest } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";
import { formatZodErrors } from "@/lib/validators";
import { isValidObjectId } from "@/lib/utils";
import { requireRole } from "@/lib/auth";

const reviewSchema = z.object({
  action: z.enum(["approve", "reject"], {
    message: "Action must be either approve or reject",
  }),
  note: z.string().max(500).optional(),
});

/**
 * GET /api/admin-requests/[id]
 * Fetch a single signup request — superadmin only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["superadmin"]);
    await dbConnect();
    const { id } = await params;
    if (!isValidObjectId(id)) return errorResponse("Invalid request id", 400);

    const admin = await Admin.findById(id)
      .select("name email role status createdAt approvedAt approvedBy reviewNote")
      .lean();
    if (!admin) return errorResponse("Admin request not found", 404);

    return successResponse(admin);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/admin-requests/[id]
 * Approve or reject a pending signup — superadmin only.
 *
 * Approving activates the account and lets it log in; rejecting leaves the
 * record in place, inactive, so the same address cannot silently retry.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["superadmin"]);
    await dbConnect();
    const { id } = await params;
    if (!isValidObjectId(id)) return errorResponse("Invalid request id", 400);

    const body = await request.json();
    const validation = reviewSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        "Validation failed",
        400,
        formatZodErrors(validation.error)
      );
    }

    const admin = await Admin.findById(id);
    if (!admin) return errorResponse("Admin request not found", 404);

    // A superadmin reviewing their own request would be a way to self-approve.
    if (String(admin._id) === session.id) {
      return errorResponse("You cannot review your own account request", 403);
    }

    if (admin.status !== "pending") {
      return errorResponse(
        `This request has already been ${admin.status}`,
        409
      );
    }

    const { action, note } = validation.data;

    admin.status = action === "approve" ? "approved" : "rejected";
    admin.isActive = action === "approve";
    admin.approvedBy = session.id as unknown as typeof admin.approvedBy;
    admin.approvedAt = new Date();
    if (note) admin.reviewNote = note;

    await admin.save();

    return successResponse(
      {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
        isActive: admin.isActive,
      },
      action === "approve"
        ? `${admin.name} has been approved and can now log in`
        : `${admin.name}'s request has been rejected`
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin-requests/[id]
 * Permanently discard a signup request — superadmin only.
 * Refuses to touch an already-approved account, so this cannot be used to
 * delete a colleague's live admin account by mistake.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["superadmin"]);
    await dbConnect();
    const { id } = await params;
    if (!isValidObjectId(id)) return errorResponse("Invalid request id", 400);

    const admin = await Admin.findById(id);
    if (!admin) return errorResponse("Admin request not found", 404);

    if (String(admin._id) === session.id) {
      return errorResponse("You cannot delete your own account here", 403);
    }

    if (admin.status === "approved" || admin.status === undefined) {
      return errorResponse(
        "This account is approved — deactivate it from Users instead",
        409
      );
    }

    await admin.deleteOne();

    return successResponse(null, "Admin request deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
