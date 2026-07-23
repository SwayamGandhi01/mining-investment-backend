import { uploadImage, uploadMultipleImages, deleteImage } from "./cloudinary";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB limit

/**
 * Validate a file before upload.
 */
function validateFile(file: any): string | null {
  if (!file || typeof file !== "object" || typeof file.arrayBuffer !== "function") {
    return "Invalid file payload provided";
  }

  if (file.size && file.size > MAX_FILE_SIZE) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max allowed size: 20MB`;
  }

  return null;
}

/**
 * Convert a File object or Blob to a base64 data URI for upload.
 */
async function fileToBase64(file: any): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");
  const mimeType = file.type || "image/jpeg";
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Handle single file upload from FormData.
 */
export async function handleSingleUpload(
  formData: FormData,
  fieldName: string = "file",
  folder: string = "general"
): Promise<{ url: string; publicId: string }> {
  let file = formData.get(fieldName) as any;
  if (!file) {
    // Try alternative field names
    file = (formData.get("image") || formData.get("file") || formData.get("pdf")) as any;
  }

  if (!file) {
    throw new Error("No file provided in form data");
  }

  const validationError = validateFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const base64 = await fileToBase64(file);
  const result = await uploadImage(base64, folder);

  return {
    url: result.url,
    publicId: result.publicId,
  };
}

/**
 * Handle multiple file uploads from FormData.
 */
export async function handleMultipleUpload(
  formData: FormData,
  fieldName: string = "files",
  folder: string = "general"
): Promise<Array<{ url: string; publicId: string }>> {
  let files = formData.getAll(fieldName) as any[];
  if (!files || files.length === 0) {
    files = (formData.getAll("images") || formData.getAll("files")) as any[];
  }

  if (!files || files.length === 0) {
    // Check if a single file was passed under "file" or "image"
    const single = formData.get("file") || formData.get("image");
    if (single) {
      files = [single];
    }
  }

  if (!files || files.length === 0) {
    throw new Error("No files provided in form data");
  }

  const validFiles = files.filter(
    (f) => f && typeof f === "object" && typeof f.arrayBuffer === "function"
  );

  if (validFiles.length === 0) {
    throw new Error("No valid files provided");
  }

  const base64Files = await Promise.all(validFiles.map((f) => fileToBase64(f)));
  const results = await uploadMultipleImages(base64Files, folder);

  return results.map((r) => ({
    url: r.url,
    publicId: r.publicId,
  }));
}

/**
 * Handle image deletion.
 */
export async function handleDeleteUpload(publicId: string): Promise<boolean> {
  return deleteImage(publicId);
}

export { MAX_FILE_SIZE };
