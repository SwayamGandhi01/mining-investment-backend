import { clearAuthCookie } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/response";

export async function POST() {
  try {
    await clearAuthCookie();
    return successResponse(null, "Logout successful");
  } catch (error) {
    return handleApiError(error);
  }
}
