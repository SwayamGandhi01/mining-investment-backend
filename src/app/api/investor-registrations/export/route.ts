import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import InvestorRegistration from "@/models/InvestorRegistration";
import {
  getPaginationParams,
  buildSortQuery,
  buildSearchQuery,
  buildFilterQuery,
} from "@/lib/pagination";
import { handleApiError } from "@/lib/response";
import { requireAuth } from "@/lib/auth";
import { buildCsv, csvDate, csvResponse, EXPORT_ROW_CAP, type CsvColumn } from "@/lib/csv";

interface InvestorRow {
  registrationNumber?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  businessTitle?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
  investorType?: string;
  assetsUnderManagement?: string;
  signUpForNews?: boolean;
  status?: string;
  createdAt?: Date;
}

const COLUMNS: CsvColumn<InvestorRow>[] = [
  { header: "Registration #", value: (r) => r.registrationNumber },
  { header: "Company Name", value: (r) => r.companyName },
  { header: "First Name", value: (r) => r.firstName },
  { header: "Last Name", value: (r) => r.lastName },
  { header: "Business Title", value: (r) => r.businessTitle },
  { header: "City", value: (r) => r.city },
  { header: "Country", value: (r) => r.country },
  { header: "Email", value: (r) => r.email },
  { header: "Phone", value: (r) => r.phone },
  { header: "Investor Type", value: (r) => r.investorType },
  { header: "Assets Under Management", value: (r) => r.assetsUnderManagement },
  { header: "Signed Up For News", value: (r) => r.signUpForNews },
  { header: "Status", value: (r) => r.status },
  { header: "Registered At", value: (r) => csvDate(r.createdAt) },
];

/**
 * GET /api/investor-registrations/export
 * Download every matching investor registration as CSV — admin only.
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
        "firstName",
        "lastName",
        "email",
        "registrationNumber",
        "investorType",
      ])
    );

    const rows = await InvestorRegistration.find(filter)
      .sort(buildSortQuery(params))
      .limit(EXPORT_ROW_CAP)
      .lean<InvestorRow[]>();

    return csvResponse(buildCsv(rows, COLUMNS), "investor-registrations", rows.length);
  } catch (error) {
    return handleApiError(error);
  }
}
