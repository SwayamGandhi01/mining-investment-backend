import { NextRequest } from "next/server";
import { handleSingleUpload, handleMultipleUpload, handleDeleteUpload } from "@/lib/upload";
import { successResponse, errorResponse } from "@/lib/response";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const folder = (formData.get("folder") as string) || "general";

    if (formData.has("files") || formData.has("images")) {
      const fieldName = formData.has("files") ? "files" : "images";
      const results = await handleMultipleUpload(formData, fieldName, folder);
      return successResponse(results, "Images uploaded successfully", 200);
    }

    const fieldName = formData.has("image") ? "image" : "file";
    const result = await handleSingleUpload(formData, fieldName, folder);
    return successResponse(result, "Image uploaded successfully", 200);
  } catch (error) {
    console.error("Upload route error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload image";
    return errorResponse(message, 400);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get("publicId");

    if (!publicId) {
      return errorResponse("Public ID is required", 400);
    }

    const success = await handleDeleteUpload(publicId);
    if (!success) {
      return errorResponse("Failed to delete image", 400);
    }

    return successResponse(null, "Image deleted successfully");
  } catch (error) {
    console.error("Delete route error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete image";
    return errorResponse(message, 400);
  }
}
