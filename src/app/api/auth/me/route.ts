import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { requireAuth } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/response";

export async function GET() {
  try {
    const session = await requireAuth();
    await dbConnect();

    const admin = await Admin.findById(session.id).lean();
    if (!admin) {
      return new Response(
        JSON.stringify({ success: false, message: "Admin not found" }),
        { status: 404 }
      );
    }

    return successResponse(
      {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar,
      },
      "Admin retrieved successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
