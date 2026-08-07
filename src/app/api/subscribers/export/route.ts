import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Subscriber from "@/models/Subscriber";
import {
  getPaginationParams,
  buildSortQuery,
  buildSearchQuery,
  buildFilterQuery,
} from "@/lib/pagination";
import { handleApiError } from "@/lib/response";
import { requireAuth } from "@/lib/auth";
import { buildCsv, csvDate, csvResponse, EXPORT_ROW_CAP, type CsvColumn } from "@/lib/csv";

interface SubscriberRow {
  fullName?: string;
  email?: string;
  createdAt?: Date;
}

const COLUMNS: CsvColumn<SubscriberRow>[] = [
  { header: "Full Name", value: (r) => r.fullName },
  { header: "Email", value: (r) => r.email },
  { header: "Subscribed At", value: (r) => csvDate(r.createdAt) },
];

/**
 * GET /api/subscribers/export
 * Download every matching subscriber as CSV — admin only.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await dbConnect();

    const params = getPaginationParams(request);
    const filter = buildFilterQuery(
      params,
      buildSearchQuery(params.search, ["fullName", "email"])
    );

    const rows = await Subscriber.find(filter)
      .sort(buildSortQuery(params))
      .limit(EXPORT_ROW_CAP)
      .lean<SubscriberRow[]>();

    return csvResponse(buildCsv(rows, COLUMNS), "subscribers", rows.length);
  } catch (error) {
    return handleApiError(error);
  }
}
