import { NextRequest } from "next/server";
import { handleMultipleUpload } from "@/lib/upload";
import { successResponse, errorResponse } from "@/lib/response";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const folder = (formData.get("folder") as string) || "general";

    const fieldName = formData.has("files") ? "files" : formData.has("images") ? "images" : "file";
    const results = await handleMultipleUpload(formData, fieldName, folder);
    return successResponse(results, "Images uploaded successfully", 200);
  } catch (error) {
    console.error("Multiple upload route error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload images";
    return errorResponse(message, 400);
  }
}
