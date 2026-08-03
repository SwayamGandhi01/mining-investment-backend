import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Agenda from "@/models/Agenda";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";
import { agendaSchema } from "@/lib/validations/agenda";
import { formatZodErrors } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const item = await Agenda.findOne({ _id: id, isDeleted: { $ne: true } }).lean();

    if (!item) {
      return errorResponse("Agenda not found", 404);
    }

    return successResponse(item);
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
    const validation = agendaSchema.partial().safeParse(body);

    if (!validation.success) {
      return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
    }

    const updated = await Agenda.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: validation.data },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return errorResponse("Agenda not found", 404);
    }

    return successResponse(updated, "Agenda updated successfully");
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
    const updated = await Agenda.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: body },
      { new: true }
    );

    if (!updated) {
      return errorResponse("Agenda not found", 404);
    }

    return successResponse(updated, "Agenda updated successfully");
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

    const deleted = await Agenda.findOneAndDelete({
      _id: id,
      isDeleted: { $ne: true },
    });

    if (!deleted) {
      return errorResponse("Agenda not found", 404);
    }

    return successResponse(null, "Agenda deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
