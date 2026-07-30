import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Event from "@/models/Event";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";
import { eventSchema } from "@/lib/validations/event";
import { formatZodErrors } from "@/lib/validators";
import { isValidObjectId } from "@/lib/utils";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/auth";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const query = isValidObjectId(id) ? { _id: new mongoose.Types.ObjectId(id) } : { slug: id };
    console.log('EVENTS GET params id=', id, 'query=', query);
    // Use direct collection lookup to avoid potential mongoose population/connection issues
    let event: any = null;
    const notDeletedFilter = { isDeleted: { $ne: true } };
    if (isValidObjectId(id)) {
      // try ObjectId match first, but also fall back to slug if the id happens to be slug-shaped
      event =
        (await Event.collection.findOne({ _id: new mongoose.Types.ObjectId(id), ...notDeletedFilter })) ||
        (await Event.collection.findOne({ slug: id, ...notDeletedFilter }));
    } else {
      event = await Event.collection.findOne({ slug: id, ...notDeletedFilter });
    }
    console.log('EVENTS GET found=', Boolean(event));

    if (!event) {
      return errorResponse("Event not found", 404);
    }

    return successResponse(event);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;

    const body = await request.json();
    const validation = eventSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
    }

    const event = await Event.findById(id);
    if (!event || event.isDeleted) {
      return errorResponse("Event not found", 404);
    }

    let slug = event.slug;
    if (validation.data.title !== event.title) {
      slug = await ensureUniqueSlug(generateSlug(validation.data.title), "Event", id);
    }

    Object.assign(event, validation.data, { slug });
    await event.save();

    return successResponse(event, "Event updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;

    const body = await request.json();
    const event = await Event.findByIdAndUpdate(id, body, { new: true });

    if (!event || event.isDeleted) {
      return errorResponse("Event not found", 404);
    }

    return successResponse(event, "Event updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;

    const event = await Event.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

    if (!event) {
      return errorResponse("Event not found", 404);
    }

    return successResponse(null, "Event deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
