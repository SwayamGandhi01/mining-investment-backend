import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { hashPassword } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";

/**
 * Seed the first superadmin account.
 * This only works if no admin accounts exist yet.
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Check if any admin already exists
    const existingAdmin = await Admin.findOne().lean();
    if (existingAdmin) {
      return errorResponse(
        "Admin accounts already exist. Seeding is disabled.",
        403
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return errorResponse("Name, email, and password are required", 400);
    }

    if (password.length < 8) {
      return errorResponse("Password must be at least 8 characters", 400);
    }

    // Hash password and create superadmin
    const hashedPassword = await hashPassword(password);
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: "superadmin",
      isActive: true,
    });

    return successResponse(
      {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      "Superadmin created successfully",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
