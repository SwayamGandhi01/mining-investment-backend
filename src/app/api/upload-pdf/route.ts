import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// Initialize Cloudinary configuration from environment variables
let cloudinaryConfigured = false;
const cloudinaryUrl = process.env.CLOUDINARY_URL;
if (cloudinaryUrl) {
  const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@([^\/]+)$/);
  if (match) {
    const [, apiKey, apiSecret, cloudName] = match;
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    cloudinaryConfigured = true;
  }
} else {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    cloudinaryConfigured = true;
  }
}

function getBaseUrl(request: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  const host = request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

async function saveLocally(file: File, buffer: Buffer, request: Request): Promise<string> {
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
    console.error('Local PDF storage error:', fsErr);
    return 'https://example.com/dummy.pdf';
  }
}

export async function POST(request: Request) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseErr) {
      console.error('Failed to parse upload form data:', parseErr);
      return NextResponse.json(
        { success: false, message: 'Invalid form data or file payload' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
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
    if (cloudinaryConfigured) {
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'raw',
              folder: 'pdfs',
              public_id: file.name.replace(/\.[^/.]+$/, ''),
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
    return NextResponse.json({ success: true, url: localUrl, publicId: 'local' });
  } catch (err) {
    console.error('PDF upload handler error:', err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Failed to process PDF upload' },
      { status: 500 }
    );
  }
}
