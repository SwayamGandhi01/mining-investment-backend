import { NextRequest } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { comparePassword } from "@/lib/auth";
import { setAuthCookie } from "@/lib/auth";
import { signToken } from "@/lib/jwt";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/lib/response";
import { formatZodErrors } from "@/lib/validators";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
    }

    const { email, password } = validation.data;

    // Find admin with password field included
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      return errorResponse("Invalid email or password", 401);
    }

    // Check if admin is active
    if (!admin.isActive) {
      return errorResponse("Your account has been deactivated", 403);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, admin.password);
    if (!isPasswordValid) {
      return errorResponse("Invalid email or password", 401);
    }

    // Generate JWT token
    const token = signToken({
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    });

    // Set HTTP-only cookie
    await setAuthCookie(token);

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Return admin data (password is excluded by toJSON transform)
    return successResponse(
      {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar,
      },
      "Login successful"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
