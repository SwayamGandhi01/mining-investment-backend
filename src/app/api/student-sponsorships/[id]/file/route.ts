import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import StudentSponsorship from "@/models/StudentSponsorship";
import { errorResponse, handleApiError } from "@/lib/response";
import { isValidObjectId } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/**
 * GET /api/student-sponsorships/[id]/file?type=resume|letter
 *
 * Streams an applicant's resume or letter-of-interest file back with its
 * original filename and content type.
 *
 * Why proxy instead of linking straight at Cloudinary: raw assets are stored
 * without a file extension (this account has PDF delivery disabled, which
 * serves a ".pdf" asset as 401), so Cloudinary hands the file over as
 * `application/octet-stream` named `sarah-jenkins-resume-1786099899634` with no
 * extension — Windows then has no idea what to open it with. Going through here
 * restores "Sarah Jenkins - Resume.pdf" from the filename stored at upload time.
 *
 * Admin only — the same auth as every other read of an application.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();

    const { id } = await params;
    if (!isValidObjectId(id)) return errorResponse("Invalid sponsorship id", 400);

    const type = request.nextUrl.searchParams.get("type") === "letter" ? "letter" : "resume";

    const sponsorship = await StudentSponsorship.findOne({
      _id: id,
      isDeleted: { $ne: true },
    }).lean();
    if (!sponsorship) return errorResponse("Student sponsorship not found", 404);

    const attachment =
      type === "letter" ? sponsorship.letterOfInterestFile : sponsorship.resume;
    if (!attachment?.url) {
      return errorResponse(
        type === "letter" ? "No letter of interest file on this application" : "No resume on this application",
        404
      );
    }

    const upstream = await fetch(attachment.url);
    if (!upstream.ok || !upstream.body) {
      console.error(`Attachment fetch failed (${attachment.url}): ${upstream.status}`);
      return errorResponse("Could not retrieve the stored file", 502);
    }

    const fallback = type === "letter" ? "letter-of-interest" : "resume";
    const fileName = attachment.fileName || fallback;
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    const contentType = MIME_BY_EXTENSION[extension] || "application/octet-stream";

    // RFC 5987 for the non-ASCII case; the plain filename covers older clients.
    const asciiName = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");

    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition":
        `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, no-store",
    });
    const length = upstream.headers.get("content-length");
    if (length) headers.set("Content-Length", length);

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (error) {
    return handleApiError(error);
  }
}
