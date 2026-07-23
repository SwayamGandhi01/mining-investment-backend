import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { hashPassword } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return errorResponse("Name, email, and password are required", 400);
    }

    if (password.length < 8) {
      return errorResponse("Password must be at least 8 characters", 400);
    }

    const allowedRoles = ["superadmin", "admin", "editor"];
    const selectedRole = role && allowedRoles.includes(role) ? role : "admin";

    // If trying to register as superadmin, check that one doesn't already exist
    if (selectedRole === "superadmin") {
      const existingSuperAdmin = await Admin.findOne({ role: "superadmin" }).lean();
      if (existingSuperAdmin) {
        return errorResponse(
          "A superadmin account already exists. Only one superadmin is allowed.",
          409
        );
      }
    }

    // Check if email is already registered
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase().trim() }).lean();
    if (existingAdmin) {
      return errorResponse("An account with this email already exists.", 409);
    }

    const hashedPassword = await hashPassword(password);
    const admin = await Admin.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: selectedRole,
      isActive: true,
    });

    return successResponse(
      {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      "Account created successfully! You can now log in.",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
