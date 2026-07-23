import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Sponsor from "@/models/Sponsor";
import { getPaginationParams, buildSortQuery, buildSearchQuery, buildFilterQuery, getSkip } from "@/lib/pagination";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";
import { successResponse, paginatedResponse, errorResponse, handleApiError } from "@/lib/response";
import { sponsorSchema } from "@/lib/validations/sponsor";
import { formatZodErrors } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const params = getPaginationParams(request);
    const filter = buildFilterQuery(params, buildSearchQuery(params.search, ["name", "tier", "description"]));
    const sort = buildSortQuery(params);
    const skip = getSkip(params.page, params.limit);

    const [data, total] = await Promise.all([
      Sponsor.find(filter).sort(sort).skip(skip).limit(params.limit).lean(),
      Sponsor.countDocuments(filter),
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
    const validation = sponsorSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
    }

    const slug = await ensureUniqueSlug(generateSlug(validation.data.name), "Sponsor");

    const newSponsor = await Sponsor.create({
      ...validation.data,
      slug,
    });

    return successResponse(newSponsor, "Sponsor created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
