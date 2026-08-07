import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Storage for non-image files (PDF, DOC, DOCX).
 *
 * Cloudinary rejects raw files above the account plan's cap — 10MB on the Free
 * plan ("File size too large. Got X. Maximum is 10485760"), which chunked
 * upload_large does not get around. Anything over the cap can only be stored on
 * local disk, which does not survive a deploy, so callers reject it up front.
 * Raise MAX_PDF_UPLOAD_MB after upgrading the Cloudinary plan.
 */
export const MAX_UPLOAD_MB = Number(process.env.MAX_PDF_UPLOAD_MB || 10);
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export interface StoredFile {
  url: string;
  publicId: string;
  fileName: string;
}

export function configureCloudinary(): boolean {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (cloudinaryUrl) {
    const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@([^\/]+)$/);
    if (match) {
      const [, apiKey, apiSecret, cloudName] = match;
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      return true;
    }
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    return true;
  }

  return false;
}

export function getBaseUrl(request: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  const host = request.headers.get("host") || "localhost:3000";
  const proto =
    request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function saveLocally(
  file: File,
  buffer: Buffer,
  request: Request,
  subdir: string
): Promise<string | null> {
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", subdir);
    await mkdir(uploadDir, { recursive: true });

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    await writeFile(path.join(uploadDir, safeName), buffer);

    return `${getBaseUrl(request)}/uploads/${subdir}/${safeName}`;
  } catch (fsErr) {
    // Read-only filesystems (most serverless hosts) land here. Returning a
    // placeholder URL would report success for a file that was never stored.
    console.error("Local file storage error:", fsErr);
    return null;
  }
}

/**
 * Upload a raw file to Cloudinary, falling back to local disk.
 *
 * Returns null when the file could not be stored anywhere — callers must treat
 * that as a failure rather than reporting a success with no usable URL.
 */
export async function storeRawFile(
  file: File,
  request: Request,
  folder: string
): Promise<StoredFile | null> {
  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch (bufErr) {
    console.error("Failed to read file buffer:", bufErr);
    return null;
  }

  if (configureCloudinary()) {
    try {
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const safeBase = baseName
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
      // Deliberately no file extension. This account has PDF/ZIP delivery
      // disabled (Settings > Security), so a ".pdf" asset is served as
      // 401 "deny or ACL failure", while an extensionless raw asset is served
      // fine as application/octet-stream — which pdf.js reads without issue.
      // If raw delivery is enabled on the account, append the extension here so
      // the file downloads with a sensible name and Content-Type.
      const publicId = `${safeBase || "file"}-${Date.now()}`;

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            folder,
            public_id: publicId,
            unique_filename: false,
            overwrite: true,
          },
          (error, res) => (error ? reject(error) : resolve(res))
        );
        const readable = new Readable();
        readable._read = () => {};
        readable.push(buffer);
        readable.push(null);
        readable.pipe(uploadStream);
      });

      const { secure_url, public_id } = result as { secure_url: string; public_id: string };
      return { url: secure_url, publicId: public_id, fileName: file.name };
    } catch (cloudinaryErr) {
      console.warn("Cloudinary upload failed, falling back to local disk storage:", cloudinaryErr);
    }
  }

  const localUrl = await saveLocally(file, buffer, request, folder);
  if (!localUrl) return null;
  return { url: localUrl, publicId: "local", fileName: file.name };
}
