import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Event from "@/models/Event";
import { getPaginationParams, buildSortQuery, buildSearchQuery, buildFilterQuery, getSkip } from "@/lib/pagination";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";
import { successResponse, paginatedResponse, errorResponse, handleApiError } from "@/lib/response";
import { eventSchema } from "@/lib/validations/event";
import { formatZodErrors } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";
import { sortAgendaDays, pruneAgendaDays, sortEventAgendas } from "@/lib/agenda";

const normalizeEventPayload = (input: Record<string, any>) => {
  const normalized = { ...input };
  const agendaGroups = Array.isArray(normalized.agenda)
    ? normalized.agenda
    : Array.isArray(normalized.interactiveAgenda)
      ? normalized.interactiveAgenda
      : Array.isArray(normalized.days)
        ? normalized.days
        : [];

  if (agendaGroups.length > 0) {
    // Drop the create form's untouched placeholder rows, then store sessions in
    // chronological order so every consumer reads them sorted.
    const cleaned = sortAgendaDays(pruneAgendaDays(agendaGroups));
    normalized.agenda = cleaned;
    normalized.interactiveAgenda = cleaned;
  }

  return normalized;
};

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const params = getPaginationParams(request);
    const filter = buildFilterQuery(params, buildSearchQuery(params.search, ["title", "description", "location"]));
    const sort = buildSortQuery(params);
    const skip = getSkip(params.page, params.limit);

    const [data, total] = await Promise.all([
      Event.find(filter).sort(sort).skip(skip).limit(params.limit).lean(),
      Event.countDocuments(filter),
    ]);

    // Sort on read too, so events saved before this was introduced still come
    // back chronologically without needing a migration.
    return paginatedResponse(data.map(sortEventAgendas), total, params.page, params.limit);
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
      return errorResponse("At least one event entry is required", 400);
    }

    const createdEvents = [] as Array<any>;

    for (const item of items) {
      const normalizedItem = normalizeEventPayload(item);
      const validation = eventSchema.safeParse(normalizedItem);

      if (!validation.success) {
        return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
      }

      const slug = await ensureUniqueSlug(generateSlug(validation.data.title), "Event");

      const newEvent = await Event.create({
        ...validation.data,
        slug,
      });

      createdEvents.push(newEvent);
    }

    const responseData = Array.isArray(body) ? createdEvents : createdEvents[0];
    const message = Array.isArray(body) ? "Events created successfully" : "Event created successfully";

    return successResponse(responseData, message, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
