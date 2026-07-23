import { NextRequest } from "next/server";

export interface PaginationParams {
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
  search: string;
  status?: string;
  year?: string;
}

/**
 * Extract pagination, sorting, and search parameters from request URL.
 */
export function getPaginationParams(request: NextRequest): PaginationParams {
  const { searchParams } = request.nextUrl;

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
  );
  const sort = searchParams.get("sort") || "createdAt";
  const order = (searchParams.get("order") || "desc") as "asc" | "desc";
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || undefined;
  const year = searchParams.get("year") || searchParams.get("edition") || undefined;

  return { page, limit, sort, order, search, status, year };
}

/**
 * Build a MongoDB sort object from pagination params.
 */
export function buildSortQuery(params: PaginationParams): Record<string, 1 | -1> {
  return { [params.sort]: params.order === "asc" ? 1 : -1 };
}

/**
 * Build a MongoDB search query for given fields.
 */
export function buildSearchQuery(
  search: string,
  fields: string[]
): Record<string, unknown> {
  if (!search.trim()) return {};

  const searchRegex = new RegExp(search.trim(), "i");
  return {
    $or: fields.map((field) => ({ [field]: searchRegex })),
  };
}

/**
 * Build a MongoDB filter query from status and year parameters.
 */
export function buildFilterQuery(
  params: PaginationParams,
  additionalFilters: Record<string, unknown> = {}
): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    isDeleted: { $ne: true },
    ...additionalFilters,
  };

  if (params.status) {
    filter.status = params.status;
  }

  if (params.year && params.year !== "all") {
    const numericYear = parseInt(params.year, 10);
    if (!isNaN(numericYear)) {
      filter.year = numericYear;
    }
  }

  return filter;
}

/**
 * Calculate skip value for MongoDB pagination.
 */
export function getSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}
