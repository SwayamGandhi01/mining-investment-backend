import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { successResponse, handleApiError } from "@/lib/response";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await dbConnect();
    let settings = await Settings.findOne().lean();

    if (!settings) {
      settings = await Settings.create({ siteName: "Investment Platform" });
    }

    return successResponse(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    await dbConnect();

    const body = await request.json();
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings(body);
    } else {
      Object.assign(settings, body);
    }

    await settings.save();
    return successResponse(settings, "Settings updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
