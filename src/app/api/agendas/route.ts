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

const normalizeAgendaPayload = (input: Record<string, any>) => {
  const normalized = { ...input };
  const dayGroups = Array.isArray(normalized.days)
    ? normalized.days
    : Array.isArray(normalized.schedule)
      ? normalized.schedule
      : Array.isArray(normalized.agenda)
        ? normalized.agenda
        : [];

  if (dayGroups.length > 0) {
    normalized.days = dayGroups;
    normalized.scheduleType = normalized.scheduleType || "interactive";

    if (!normalized.eventDates) {
      const eventDates = dayGroups
        .map((day: any) => day.date || day.day)
        .filter(Boolean)
        .join(", ");
      normalized.eventDates = eventDates;
    }
  }

  return normalized;
};

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    await dbConnect();

    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      return errorResponse("At least one agenda entry is required", 400);
    }

    const createdAgendas = [] as Array<any>;

    for (const item of items) {
      const normalizedItem = normalizeAgendaPayload(item);
      const validation = agendaSchema.safeParse(normalizedItem);

      if (!validation.success) {
        return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
      }

      const slug = await ensureUniqueSlug(generateSlug(validation.data.title), "Agenda");

      const newAgenda = await Agenda.create({
        ...validation.data,
        slug,
      });

      createdAgendas.push(newAgenda);
    }

    const responseData = Array.isArray(body) ? createdAgendas : createdAgendas[0];
    const message = Array.isArray(body) ? "Agendas created successfully" : "Agenda created successfully";

    return successResponse(responseData, message, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
