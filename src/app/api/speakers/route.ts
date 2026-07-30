import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Speaker from "@/models/Speaker";
import { getPaginationParams, buildSortQuery, buildSearchQuery, buildFilterQuery, getSkip } from "@/lib/pagination";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";
import { successResponse, paginatedResponse, errorResponse, handleApiError } from "@/lib/response";
import { speakerSchema } from "@/lib/validations/speaker";
import { formatZodErrors } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const params = getPaginationParams(request);
    const filter = buildFilterQuery(params, buildSearchQuery(params.search, ["name", "title", "company"]));
    const sort = buildSortQuery(params);
    const skip = getSkip(params.page, params.limit);

    const [data, total] = await Promise.all([
      Speaker.find(filter).sort(sort).skip(skip).limit(params.limit).lean(),
      Speaker.countDocuments(filter),
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
      return errorResponse("At least one speaker entry is required", 400);
    }

    const createdSpeakers = [] as Array<any>;

    for (const item of items) {
      const validation = speakerSchema.safeParse(item);

      if (!validation.success) {
        return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
      }

      const slug = await ensureUniqueSlug(generateSlug(validation.data.name), "Speaker");

      const newSpeaker = await Speaker.create({
        ...validation.data,
        slug,
      });

      createdSpeakers.push(newSpeaker);
    }

    const responseData = Array.isArray(body) ? createdSpeakers : createdSpeakers[0];
    const message = Array.isArray(body) ? "Speakers created successfully" : "Speaker created successfully";

    return successResponse(responseData, message, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
