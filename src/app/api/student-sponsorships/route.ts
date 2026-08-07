import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import StudentSponsorship from "@/models/StudentSponsorship";
import {
  getPaginationParams,
  buildSortQuery,
  buildSearchQuery,
  buildFilterQuery,
  getSkip,
} from "@/lib/pagination";
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  handleApiError,
} from "@/lib/response";
import {
  studentSponsorshipSchema,
  isAcceptedDocument,
} from "@/lib/validations/studentSponsorship";
import { formatZodErrors } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";
import { storeRawFile, MAX_UPLOAD_MB, MAX_UPLOAD_BYTES } from "@/lib/rawUpload";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/student-sponsorships
 * List all student sponsorship applications — admin only.
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
    const sort = buildSortQuery(params);
    const skip = getSkip(params.page, params.limit);

    const [data, total] = await Promise.all([
      StudentSponsorship.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(params.limit)
        .lean(),
      StudentSponsorship.countDocuments(filter),
    ]);

    return paginatedResponse(
      data,
      total,
      params.page,
      params.limit,
      "Student sponsorships retrieved successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/** Field names the public form sends as file parts. */
const FILE_FIELDS = ["resume", "letterOfInterestFile"] as const;

/**
 * Read a multipart submission into the shape the validation schema expects,
 * uploading any attached resume / letter-of-interest file along the way.
 *
 * Handling the files here rather than behind a standalone public upload
 * endpoint means an upload can only happen as part of a real application, so
 * there is no open file-drop for anyone on the internet to abuse.
 */
async function parseMultipart(
  request: NextRequest
): Promise<{ data: Record<string, unknown> } | { error: string; status: number }> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch (parseErr) {
    // The usual cause is a body over proxyClientMaxBodySize: Next truncates it,
    // so what reaches here is no longer valid multipart data.
    console.error("Failed to parse sponsorship form data:", parseErr);
    return {
      error: `Could not read the submission — an attachment is likely over the ${MAX_UPLOAD_MB}MB limit.`,
      status: 413,
    };
  }

  const data: Record<string, unknown> = {};

  for (const [key, value] of form.entries()) {
    if (typeof value === "string" && !FILE_FIELDS.includes(key as never)) {
      data[key] = value;
    }
  }

  // Checkboxes arrive as "true"/"false"/"on"; Zod wants a real boolean.
  if (typeof data.signUpForNews === "string") {
    data.signUpForNews = ["true", "on", "1", "yes"].includes(
      (data.signUpForNews as string).toLowerCase()
    );
  }

  for (const field of FILE_FIELDS) {
    const file = form.get(field);
    if (!file || typeof file === "string" || file.size === 0) continue;

    if (!isAcceptedDocument(file)) {
      return { error: `${field}: only PDF, DOC and DOCX files are accepted`, status: 400 };
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return {
        error:
          `${field} is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). ` +
          `The limit is ${MAX_UPLOAD_MB}MB.`,
        status: 413,
      };
    }

    const stored = await storeRawFile(file, request, "student-sponsorships");
    if (!stored) {
      return { error: `Could not store the uploaded ${field}. Please try again.`, status: 500 };
    }
    data[field] = stored;
  }

  return { data };
}

/**
 * POST /api/student-sponsorships
 * Submit a new student sponsorship application — public.
 *
 * Accepts multipart/form-data (the public form, with resume and letter-of-
 * interest attachments) or JSON (files already uploaded, passed as objects).
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const isMultipart = (request.headers.get("content-type") || "").includes(
      "multipart/form-data"
    );

    let body: unknown;
    if (isMultipart) {
      const parsed = await parseMultipart(request);
      if ("error" in parsed) return errorResponse(parsed.error, parsed.status);
      body = parsed.data;
    } else {
      body = await request.json();
    }

    const validation = studentSponsorshipSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Validation failed",
        400,
        formatZodErrors(validation.error)
      );
    }

    const regNumber = "STU-" + uuidv4().slice(0, 8).toUpperCase();

    const newSponsorship = await StudentSponsorship.create({
      ...validation.data,
      registrationNumber: regNumber,
    });

    return successResponse(
      newSponsorship,
      "Student sponsorship submitted successfully",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
