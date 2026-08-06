import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Subscriber from "@/models/Subscriber";
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
import { subscriberSchema } from "@/lib/validations/subscriber";
import { formatZodErrors } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/subscribers
 * List newsletter subscribers — admin only.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await dbConnect();

    const params = getPaginationParams(request);
    const filter = buildFilterQuery(
      params,
      buildSearchQuery(params.search, ["fullName", "email"])
    );
    const sort = buildSortQuery(params);
    const skip = getSkip(params.page, params.limit);

    const [data, total] = await Promise.all([
      Subscriber.find(filter).sort(sort).skip(skip).limit(params.limit).lean(),
      Subscriber.countDocuments(filter),
    ]);

    return paginatedResponse(
      data,
      total,
      params.page,
      params.limit,
      "Subscribers retrieved successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/subscribers
 * Subscribe to the newsletter — public.
 * A repeat signup for an address already on the list returns 409.
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const validation = subscriberSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Validation failed",
        400,
        formatZodErrors(validation.error)
      );
    }

    const email = validation.data.email.toLowerCase();

    // A previously removed subscriber still occupies the unique email index,
    // so re-subscribing revives that record instead of failing on a duplicate.
    const existing = await Subscriber.findOne({ email });
    if (existing) {
      if (!existing.isDeleted) {
        return errorResponse("This email is already subscribed", 409);
      }

      existing.fullName = validation.data.fullName;
      existing.isDeleted = false;
      await existing.save();

      return successResponse(existing, "Subscribed successfully", 201);
    }

    const subscriber = await Subscriber.create({
      ...validation.data,
      email,
    });

    return successResponse(subscriber, "Subscribed successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
