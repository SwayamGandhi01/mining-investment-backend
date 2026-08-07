import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import {
  getPaginationParams,
  buildSortQuery,
  buildSearchQuery,
  getSkip,
} from "@/lib/pagination";
import { paginatedResponse, handleApiError } from "@/lib/response";
import { requireRole } from "@/lib/auth";

/**
 * GET /api/admin-requests
 * List pending admin/superadmin signup requests — superadmin only.
 *
 * `?status=` accepts pending (default), approved, rejected or all.
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(["superadmin"]);
    await dbConnect();

    const params = getPaginationParams(request);
    const requestedStatus = params.status || "pending";

    const filter: Record<string, unknown> = {
      ...buildSearchQuery(params.search, ["name", "email", "role"]),
    };
    if (requestedStatus !== "all") {
      filter.status = requestedStatus;
    }

    const sort = buildSortQuery(params);
    const skip = getSkip(params.page, params.limit);

    const [data, total] = await Promise.all([
      Admin.find(filter)
        .select("name email role status createdAt approvedAt approvedBy reviewNote")
        .sort(sort)
        .skip(skip)
        .limit(params.limit)
        .lean(),
      Admin.countDocuments(filter),
    ]);

    return paginatedResponse(
      data,
      total,
      params.page,
      params.limit,
      "Admin requests retrieved successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
