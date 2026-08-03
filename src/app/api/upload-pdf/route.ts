import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Cloudinary rejects raw files above the account plan's cap — 10MB on the Free plan
 * ("File size too large. Got X. Maximum is 10485760"), which chunked upload_large
 * does not get around. Anything over the cap can only be stored on local disk, which
 * does not survive a deploy, so it is rejected up front with an actionable message.
 * Raise MAX_PDF_UPLOAD_MB after upgrading the Cloudinary plan.
 */
const MAX_PDF_MB = Number(process.env.MAX_PDF_UPLOAD_MB || 10);
const MAX_PDF_BYTES = MAX_PDF_MB * 1024 * 1024;

function configureCloudinary(): boolean {
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

function getBaseUrl(request: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  const host = request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

async function saveLocally(file: File, buffer: Buffer, request: Request): Promise<string | null> {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'pdfs');
    await mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const safeName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeName);
    await writeFile(filePath, buffer);

    const baseUrl = getBaseUrl(request);
    return `${baseUrl}/uploads/pdfs/${safeName}`;
  } catch (fsErr) {
    // Read-only filesystems (most serverless hosts) land here. Returning a
    // placeholder URL would report success for a file that was never stored.
    console.error('Local PDF storage error:', fsErr);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseErr) {
      // The usual cause is a body over proxyClientMaxBodySize: Next truncates it,
      // so what reaches here is no longer valid multipart data.
      console.error('Failed to parse upload form data:', parseErr);
      return NextResponse.json(
        {
          success: false,
          message: `Could not read the upload — the file is likely over the ${MAX_PDF_MB}MB limit.`,
        },
        { status: 413 }
      );
    }

    const file = formData.get('file') as File | null;
    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, message: 'Only PDF files are accepted' },
        { status: 400 }
      );
    }

    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        {
          success: false,
          message:
            `PDF is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). The limit is ${MAX_PDF_MB}MB — ` +
            `the cap on the current Cloudinary plan. Compress the PDF, or upgrade the plan and raise MAX_PDF_UPLOAD_MB.`,
        },
        { status: 413 }
      );
    }

    let buffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (bufErr) {
      console.error('Failed to read file buffer:', bufErr);
      return NextResponse.json(
        { success: false, message: 'Could not read file contents' },
        { status: 400 }
      );
    }

    // Try Cloudinary if configured
    const isConfigured = configureCloudinary();
    if (isConfigured) {
      try {
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const safePublicId = baseName
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
          .toLowerCase();
        // Deliberately no .pdf extension. This account has PDF/ZIP delivery
        // disabled (Settings > Security), so a ".pdf" asset is served as
        // 401 "deny or ACL failure", while an extensionless raw asset is served
        // fine as application/octet-stream — which pdf.js reads without issue.
        // If PDF delivery is enabled on the account, append ".pdf" here so the
        // file downloads with a sensible name and Content-Type.
        const publicId = `${safePublicId}-${Date.now()}`;

        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'raw',
              folder: 'pdfs',
              public_id: publicId,
              unique_filename: false,
              overwrite: true,
            },
            (error, res) => {
              if (error) reject(error);
              else resolve(res);
            }
          );
          const readable = new Readable();
          readable._read = () => {};
          readable.push(buffer);
          readable.push(null);
          readable.pipe(uploadStream);
        });

        const { secure_url, public_id } = result as { secure_url: string; public_id: string };
        return NextResponse.json({ success: true, url: secure_url, publicId: public_id });
      } catch (cloudinaryErr) {
        console.warn('Cloudinary upload failed, falling back to local disk storage:', cloudinaryErr);
      }
    }

    // Save locally if Cloudinary is not configured or fails
    const localUrl = await saveLocally(file, buffer, request);
    if (!localUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Could not store the PDF. Check the Cloudinary credentials — local disk storage is unavailable on this host.',
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, url: localUrl, publicId: 'local' });
  } catch (err) {
    console.error('PDF upload handler error:', err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Failed to process PDF upload' },
      { status: 500 }
    );
  }
}
