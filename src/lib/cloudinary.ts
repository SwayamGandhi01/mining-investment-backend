import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

function configureCloudinary(): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return false;

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  return true;
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

async function saveImageLocally(
  fileBase64: string,
  folder: string
): Promise<CloudinaryUploadResult> {
  try {
    const { writeFile, mkdir } = await import("node:fs/promises");
    const path = await import("node:path");

    const matches = fileBase64.match(/^data:(image\/[a-zA-Z0-9+-]+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : "image/jpeg";
    const base64Data = matches ? matches[2] : fileBase64;
    const rawExt = mimeType.split("/")[1]?.replace("+xml", "") || "jpg";
    const ext = rawExt === "svg" ? "svg" : rawExt === "png" ? "png" : rawExt === "webp" ? "webp" : "jpg";

    const buffer = Buffer.from(base64Data, "base64");
    const uploadDir = path.join(process.cwd(), "public", "uploads", "images", folder);
    await mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const fileName = `${timestamp}.${ext}`;
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const imageUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/uploads/images/${folder}/${fileName}`
      : `/uploads/images/${folder}/${fileName}`;

    return {
      url: imageUrl,
      publicId: `local-${timestamp}`,
      width: 800,
      height: 600,
      format: ext,
      bytes: buffer.length,
    };
  } catch (err) {
    console.error("Failed to save image locally:", err);
    return {
      url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop",
      publicId: "placeholder",
      width: 800,
      height: 600,
      format: "jpeg",
      bytes: 0,
    };
  }
}

/**
 * Upload a single image to Cloudinary (with seamless local disk fallback).
 */
export async function uploadImage(
  file: string,
  folder: string = "general"
): Promise<CloudinaryUploadResult> {
  const isConfigured = configureCloudinary();
  if (isConfigured) {
    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(file, {
        folder: `investment/${folder}`,
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error) {
      console.warn("Cloudinary image upload failed, falling back to local disk storage:", error);
      return await saveImageLocally(file, folder);
    }
  }

  // Cloudinary not configured -> save locally
  return await saveImageLocally(file, folder);
}

/**
 * Delete a single image from Cloudinary or local storage.
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    if (!publicId || publicId.startsWith("local-") || publicId === "placeholder") {
      return true;
    }
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return true;
  }
}

/**
 * Upload multiple images.
 */
export async function uploadMultipleImages(
  files: string[],
  folder: string = "general"
): Promise<CloudinaryUploadResult[]> {
  try {
    const uploadPromises = files.map((file) => uploadImage(file, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Multiple image upload error:", error);
    return [];
  }
}

/**
 * Delete multiple images.
 */
export async function deleteMultipleImages(
  publicIds: string[]
): Promise<boolean[]> {
  try {
    const deletePromises = publicIds.map((id) => deleteImage(id));
    return await Promise.all(deletePromises);
  } catch (error) {
    console.error("Multiple image delete error:", error);
    return publicIds.map(() => true);
  }
}
