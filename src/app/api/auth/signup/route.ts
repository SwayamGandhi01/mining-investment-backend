import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { hashPassword } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";
import { APPROVED_FILTER } from "@/lib/adminApproval";

/**
 * POST /api/auth/signup
 * Request an admin account — public.
 *
 * Self-signup never produces a usable account on its own: the record is created
 * with status "pending" and isActive false, and a superadmin must approve it via
 * PATCH /api/admin-requests/[id] before it can log in.
 *
 * The single exception is bootstrapping — if no approved admin exists yet, the
 * first signup becomes an active superadmin so the panel is reachable at all.
 */
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
    const requestedRole = role && allowedRoles.includes(role) ? role : "admin";
    const normalizedEmail = String(email).toLowerCase().trim();

    const existingAdmin = await Admin.findOne({ email: normalizedEmail }).lean();
    if (existingAdmin) {
      return errorResponse("An account with this email already exists.", 409);
    }

    const hashedPassword = await hashPassword(password);

    // Bootstrap: with no approved admin on the system, the first signup has to
    // be able to use the panel, otherwise nobody could ever approve anybody.
    const approvedAdminExists = await Admin.findOne(APPROVED_FILTER).lean();

    if (!approvedAdminExists) {
      const firstAdmin = await Admin.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "superadmin",
        status: "approved",
        isActive: true,
      });

      return successResponse(
        {
          id: firstAdmin._id,
          name: firstAdmin.name,
          email: firstAdmin.email,
          role: firstAdmin.role,
          status: firstAdmin.status,
        },
        "Superadmin account created successfully! You can now log in.",
        201
      );
    }

    const pending = await Admin.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: requestedRole,
      status: "pending",
      isActive: false,
    });

    return successResponse(
      {
        id: pending._id,
        name: pending.name,
        email: pending.email,
        role: pending.role,
        status: pending.status,
      },
      requestedRole === "superadmin"
        ? "Superadmin request submitted. An existing superadmin must approve it before you can log in."
        : "Account request submitted. A superadmin must approve it before you can log in.",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
