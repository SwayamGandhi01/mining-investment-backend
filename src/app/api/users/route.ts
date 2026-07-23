import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getPaginationParams, buildSortQuery, buildSearchQuery, buildFilterQuery, getSkip } from "@/lib/pagination";
import { successResponse, paginatedResponse, errorResponse, handleApiError } from "@/lib/response";
import { userSchema } from "@/lib/validations/user";
import { formatZodErrors } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const params = getPaginationParams(request);
    const filter = buildFilterQuery(params, buildSearchQuery(params.search, ["name", "email", "company"]));
    const sort = buildSortQuery(params);
    const skip = getSkip(params.page, params.limit);

    const [data, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(params.limit).lean(),
      User.countDocuments(filter),
    ]);

    return paginatedResponse(data, total, params.page, params.limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    await dbConnect();

    const body = await request.json();
    const validation = userSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
    }

    const newUser = await User.create(validation.data);
    return successResponse(newUser, "User created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
