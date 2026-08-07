import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import StudentSponsorship from "@/models/StudentSponsorship";
import {
  getPaginationParams,
  buildSortQuery,
  buildSearchQuery,
  buildFilterQuery,
} from "@/lib/pagination";
import { handleApiError } from "@/lib/response";
import { requireAuth } from "@/lib/auth";
import { buildCsv, csvDate, csvResponse, EXPORT_ROW_CAP, type CsvColumn } from "@/lib/csv";
import { requestOrigin } from "@/lib/url";

interface SponsorshipRow {
  /** An ObjectId from lean(), not a string — stringified where it is used. */
  _id: unknown;
  registrationNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  currentSchool?: string;
  programAndYear?: string;
  language?: string;
  letterOfInterest?: string;
  resume?: { url?: string; fileName?: string };
  letterOfInterestFile?: { url?: string; fileName?: string };
  signUpForNews?: boolean;
  status?: string;
  createdAt?: Date;
}

/**
 * Columns are built per request because the download links need the absolute
 * origin the admin is signed in on.
 *
 * The download links point at our own /file route rather than the raw
 * Cloudinary URL. Cloudinary stores these assets without a file extension (this
 * account has PDF delivery disabled, which serves a ".pdf" asset as a 401), so
 * clicking the storage URL saves an extensionless "unknown file" that Windows
 * cannot open. The /file route re-attaches the original name and content type.
 */
function buildColumns(origin: string): CsvColumn<SponsorshipRow>[] {
  const downloadLink = (row: SponsorshipRow, type: "resume" | "letter") =>
    `${origin}/api/student-sponsorships/${String(row._id)}/file?type=${type}`;

  return [
    { header: "Registration #", value: (r) => r.registrationNumber },
    { header: "First Name", value: (r) => r.firstName },
    { header: "Last Name", value: (r) => r.lastName },
    { header: "Email", value: (r) => r.email },
    { header: "Phone", value: (r) => r.phone },
    { header: "Current School / Institution", value: (r) => r.currentSchool },
    { header: "Program & Year of Study", value: (r) => r.programAndYear },
    { header: "Preferred Language", value: (r) => r.language },
    { header: "Letter of Interest", value: (r) => r.letterOfInterest },
    { header: "Resume File", value: (r) => r.resume?.fileName },
    { header: "Resume Download URL", value: (r) => (r.resume?.url ? downloadLink(r, "resume") : "") },
    { header: "Letter File", value: (r) => r.letterOfInterestFile?.fileName },
    {
      header: "Letter File Download URL",
      value: (r) => (r.letterOfInterestFile?.url ? downloadLink(r, "letter") : ""),
    },
    // The raw Cloudinary storage URLs are deliberately NOT exported. They look
    // like ordinary links but download an extensionless octet-stream that
    // Windows reports as an unknown file, so having them in the sheet only
    // invites clicking the wrong one. The download links above are the only
    // links here, and they always produce a correctly named file.
    { header: "Signed Up For News", value: (r) => r.signUpForNews },
    { header: "Status", value: (r) => r.status },
    { header: "Submitted At", value: (r) => csvDate(r.createdAt) },
  ];
}

/**
 * GET /api/student-sponsorships/export
 * Download every matching application as CSV — admin only.
 *
 * Honours the same search and filter parameters as the list endpoint, so the
 * export matches whatever the admin is currently looking at, but ignores
 * pagination: the point is to get the whole list, not the visible page.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await dbConnect();

    const params = getPaginationParams(request);
    const filter = buildFilterQuery(
      params,
      buildSearchQuery(params.search, [
        "firstName",
        "lastName",
        "email",
        "currentSchool",
        "programAndYear",
        "registrationNumber",
        "phone",
      ])
    );

    const rows = await StudentSponsorship.find(filter)
      .sort(buildSortQuery(params))
      .limit(EXPORT_ROW_CAP)
      .lean<SponsorshipRow[]>();

    const csv = buildCsv(rows, buildColumns(requestOrigin(request)));
    return csvResponse(csv, "student-sponsorships", rows.length);
  } catch (error) {
    return handleApiError(error);
  }
}
