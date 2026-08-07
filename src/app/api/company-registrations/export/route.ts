import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import CompanyRegistration from "@/models/CompanyRegistration";
import {
  getPaginationParams,
  buildSortQuery,
  buildSearchQuery,
  buildFilterQuery,
} from "@/lib/pagination";
import { handleApiError } from "@/lib/response";
import { requireAuth } from "@/lib/auth";
import { buildCsv, csvDate, csvResponse, EXPORT_ROW_CAP, type CsvColumn } from "@/lib/csv";

interface CompanyRegistrationRow {
  registrationNumber?: string;
  companyName?: string;
  marketCap?: string;
  primaryExchangeTicker?: string;
  commodity?: string;
  projectStage?: string;
  location?: string;
  email?: string;
  signUpForNews?: boolean;
  status?: string;
  createdAt?: Date;
}

const COLUMNS: CsvColumn<CompanyRegistrationRow>[] = [
  { header: "Registration #", value: (r) => r.registrationNumber },
  { header: "Company Name", value: (r) => r.companyName },
  { header: "Market Cap", value: (r) => r.marketCap },
  { header: "Primary Exchange / Ticker", value: (r) => r.primaryExchangeTicker },
  { header: "Commodity", value: (r) => r.commodity },
  { header: "Project Stage", value: (r) => r.projectStage },
  { header: "Location", value: (r) => r.location },
  { header: "Email", value: (r) => r.email },
  { header: "Signed Up For News", value: (r) => r.signUpForNews },
  { header: "Status", value: (r) => r.status },
  { header: "Registered At", value: (r) => csvDate(r.createdAt) },
];

/**
 * GET /api/company-registrations/export
 * Download every matching company registration as CSV — admin only.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await dbConnect();

    const params = getPaginationParams(request);
    const filter = buildFilterQuery(
      params,
      buildSearchQuery(params.search, [
        "companyName",
        "email",
        "registrationNumber",
        "commodity",
        "projectStage",
        "primaryExchangeTicker",
      ])
    );

    const rows = await CompanyRegistration.find(filter)
      .sort(buildSortQuery(params))
      .limit(EXPORT_ROW_CAP)
      .lean<CompanyRegistrationRow[]>();

    return csvResponse(buildCsv(rows, COLUMNS), "company-registrations", rows.length);
  } catch (error) {
    return handleApiError(error);
  }
}
