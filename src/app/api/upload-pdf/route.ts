import { NextResponse } from 'next/server';
import { storeRawFile, MAX_UPLOAD_MB, MAX_UPLOAD_BYTES } from '@/lib/rawUpload';

/**
 * PDF upload used by the Articles admin pages.
 *
 * The storage plumbing lives in @/lib/rawUpload so this and the public
 * /api/upload-document endpoint cannot drift apart.
 */
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
          message: `Could not read the upload — the file is likely over the ${MAX_UPLOAD_MB}MB limit.`,
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

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          success: false,
          message:
            `PDF is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). The limit is ${MAX_UPLOAD_MB}MB — ` +
            `the cap on the current Cloudinary plan. Compress the PDF, or upgrade the plan and raise MAX_PDF_UPLOAD_MB.`,
        },
        { status: 413 }
      );
    }

    const stored = await storeRawFile(file, request, 'pdfs');
    if (!stored) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Could not store the PDF. Check the Cloudinary credentials — local disk storage is unavailable on this host.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, url: stored.url, publicId: stored.publicId });
  } catch (err) {
    console.error('PDF upload handler error:', err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : 'Failed to process PDF upload' },
      { status: 500 }
    );
  }
}
