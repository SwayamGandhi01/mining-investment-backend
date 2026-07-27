import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import CompanyRegistration from "@/models/CompanyRegistration";
import {
  getPaginationParams,
  buildSortQuery,
  buildSearchQuery,
  buildFilterQuery,
  getSkip,
} from "@/lib/pagination";
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  handleApiError,
} from "@/lib/response";
import { companyRegistrationSchema } from "@/lib/validations/companyRegistration";
import { formatZodErrors } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/company-registrations
 * List all company registrations — admin only.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await dbConnect();

    const params = getPaginationParams(request);
    const filter = buildFilterQuery(
      params,
      buildSearchQuery(params.search, [
        "companyName",
        "email",
        "registrationNumber",
        "commodity",
        "projectStage",
        "primaryExchangeTicker",
      ])
    );
    const sort = buildSortQuery(params);
    const skip = getSkip(params.page, params.limit);

    const [data, total] = await Promise.all([
      CompanyRegistration.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(params.limit)
        .lean(),
      CompanyRegistration.countDocuments(filter),
    ]);

    return paginatedResponse(
      data,
      total,
      params.page,
      params.limit,
      "Company registrations retrieved successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/company-registrations
 * Submit a new company registration — public.
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const validation = companyRegistrationSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Validation failed",
        400,
        formatZodErrors(validation.error)
      );
    }

    const regNumber = "COMP-" + uuidv4().slice(0, 8).toUpperCase();

    const newRegistration = await CompanyRegistration.create({
      ...validation.data,
      registrationNumber: regNumber,
    });

    return successResponse(
      newRegistration,
      "Company registration submitted successfully",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
