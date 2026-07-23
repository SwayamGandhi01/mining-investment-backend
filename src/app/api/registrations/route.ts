import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Registration from "@/models/Registration";
import { getPaginationParams, buildSortQuery, buildSearchQuery, buildFilterQuery, getSkip } from "@/lib/pagination";
import { successResponse, paginatedResponse, errorResponse, handleApiError } from "@/lib/response";
import { registrationSchema } from "@/lib/validations/registration";
import { formatZodErrors } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const params = getPaginationParams(request);
    const filter = buildFilterQuery(params, buildSearchQuery(params.search, ["name", "email", "registrationNumber", "company"]));
    const sort = buildSortQuery(params);
    const skip = getSkip(params.page, params.limit);

    const [data, total] = await Promise.all([
      Registration.find(filter).sort(sort).skip(skip).limit(params.limit).populate("event", "title slug startDate").lean(),
      Registration.countDocuments(filter),
    ]);

    return paginatedResponse(data, total, params.page, params.limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const validation = registrationSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
    }

    const regNumber = "REG-" + uuidv4().slice(0, 8).toUpperCase();

    const newRegistration = await Registration.create({
      ...validation.data,
      registrationNumber: regNumber,
    });

    return successResponse(newRegistration, "Registration submitted successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
