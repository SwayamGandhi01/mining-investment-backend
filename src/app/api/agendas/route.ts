import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Agenda from "@/models/Agenda";
import { getPaginationParams, buildSortQuery, buildSearchQuery, buildFilterQuery, getSkip } from "@/lib/pagination";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";
import { successResponse, paginatedResponse, errorResponse, handleApiError } from "@/lib/response";
import { agendaSchema } from "@/lib/validations/agenda";
import { formatZodErrors } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const params = getPaginationParams(request);
    const filter = buildFilterQuery(
      params,
      buildSearchQuery(params.search, ["title", "venue", "description"])
    );
    const sort = buildSortQuery(params);
    const skip = getSkip(params.page, params.limit);

    const [data, total] = await Promise.all([
      Agenda.find(filter).sort(sort).skip(skip).limit(params.limit).lean(),
      Agenda.countDocuments(filter),
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
    const validation = agendaSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
    }

    const slug = await ensureUniqueSlug(generateSlug(validation.data.title), "Agenda");

    const newAgenda = await Agenda.create({
      ...validation.data,
      slug,
    });

    return successResponse(newAgenda, "Agenda created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
