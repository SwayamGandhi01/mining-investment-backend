import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import InvestorRegistration from "@/models/InvestorRegistration";
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
import { investorRegistrationSchema } from "@/lib/validations/investorRegistration";
import { formatZodErrors } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/investor-registrations
 * List all investor registrations — admin only.
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
        "firstName",
        "lastName",
        "email",
        "registrationNumber",
        "investorType",
      ])
    );
    const sort = buildSortQuery(params);
    const skip = getSkip(params.page, params.limit);

    const [data, total] = await Promise.all([
      InvestorRegistration.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(params.limit)
        .lean(),
      InvestorRegistration.countDocuments(filter),
    ]);

    return paginatedResponse(
      data,
      total,
      params.page,
      params.limit,
      "Investor registrations retrieved successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/investor-registrations
 * Submit a new investor registration — public.
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const validation = investorRegistrationSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Validation failed",
        400,
        formatZodErrors(validation.error)
      );
    }

    const regNumber = "INV-" + uuidv4().slice(0, 8).toUpperCase();

    const newRegistration = await InvestorRegistration.create({
      ...validation.data,
      registrationNumber: regNumber,
    });

    return successResponse(
      newRegistration,
      "Investor registration submitted successfully",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
