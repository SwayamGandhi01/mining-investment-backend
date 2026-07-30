import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Brochure from "@/models/Brochure";
import { getPaginationParams, buildSortQuery, buildSearchQuery, buildFilterQuery, getSkip } from "@/lib/pagination";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";
import { successResponse, paginatedResponse, errorResponse, handleApiError } from "@/lib/response";
import { brochureSchema } from "@/lib/validations/brochure";
import { formatZodErrors } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const params = getPaginationParams(request);
    const filter = buildFilterQuery(
      params,
      buildSearchQuery(params.search, ["title", "venue", "cityCountry", "description"])
    );
    const sort = buildSortQuery(params);
    const skip = getSkip(params.page, params.limit);

    const [data, total] = await Promise.all([
      Brochure.find(filter).sort(sort).skip(skip).limit(params.limit).lean(),
      Brochure.countDocuments(filter),
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
    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      return errorResponse("At least one brochure entry is required", 400);
    }

    const createdBrochures = [] as Array<any>;

    for (const item of items) {
      const validation = brochureSchema.safeParse(item);

      if (!validation.success) {
        return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
      }

      const slug = await ensureUniqueSlug(generateSlug(validation.data.title), "Brochure");

      const newBrochure = await Brochure.create({
        ...validation.data,
        slug,
      });

      createdBrochures.push(newBrochure);
    }

    const responseData = Array.isArray(body) ? createdBrochures : createdBrochures[0];
    const message = Array.isArray(body) ? "Brochures created successfully" : "Brochure created successfully";

    return successResponse(responseData, message, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
