import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import StudentSponsorship from "@/models/StudentSponsorship";
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
import { studentSponsorshipSchema } from "@/lib/validations/studentSponsorship";
import { formatZodErrors } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/student-sponsorships
 * List all student sponsorship applications — admin only.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await dbConnect();

    const params = getPaginationParams(request);
    const filter = buildFilterQuery(
      params,
      buildSearchQuery(params.search, [
        "firstName",
        "lastName",
        "email",
        "currentSchool",
        "programAndYear",
        "registrationNumber",
        "phone",
      ])
    );
    const sort = buildSortQuery(params);
    const skip = getSkip(params.page, params.limit);

    const [data, total] = await Promise.all([
      StudentSponsorship.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(params.limit)
        .lean(),
      StudentSponsorship.countDocuments(filter),
    ]);

    return paginatedResponse(
      data,
      total,
      params.page,
      params.limit,
      "Student sponsorships retrieved successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/student-sponsorships
 * Submit a new student sponsorship application — public.
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const validation = studentSponsorshipSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Validation failed",
        400,
        formatZodErrors(validation.error)
      );
    }

    const regNumber = "STU-" + uuidv4().slice(0, 8).toUpperCase();

    const newSponsorship = await StudentSponsorship.create({
      ...validation.data,
      registrationNumber: regNumber,
    });

    return successResponse(
      newSponsorship,
      "Student sponsorship submitted successfully",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
