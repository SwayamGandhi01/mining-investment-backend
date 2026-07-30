import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Company from "@/models/Company";
import { getPaginationParams, buildSortQuery, buildSearchQuery, buildFilterQuery, getSkip } from "@/lib/pagination";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";
import { successResponse, paginatedResponse, errorResponse, handleApiError } from "@/lib/response";
import { companySchema } from "@/lib/validations/company";
import { formatZodErrors } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const params = getPaginationParams(request);
    const filter = buildFilterQuery(
      params,
      
      buildSearchQuery(params.search, [
        "name",
        "ticker",
        "type",
        "location",
        "commodities",
        "industry",
        "headquarters",
        "description",
      ])
    );
    const sort = buildSortQuery(params);
    const skip = getSkip(params.page, params.limit);

    const [data, total] = await Promise.all([
      Company.find(filter).sort(sort).skip(skip).limit(params.limit).lean(),
      Company.countDocuments(filter),
    ]);

    return paginatedResponse(data, total, params.page, params.limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    await dbConnect();

    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      return errorResponse("At least one company entry is required", 400);
    }

    const createdCompanies = [] as Array<any>;

    for (const item of items) {
      const validation = companySchema.safeParse(item);

      if (!validation.success) {
        return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
      }

      const slug = await ensureUniqueSlug(generateSlug(validation.data.name), "Company");

      const newCompany = await Company.create({
        ...validation.data,
        slug,
      });

      createdCompanies.push(newCompany);
    }

    const responseData = Array.isArray(body) ? createdCompanies : createdCompanies[0];
    const message = Array.isArray(body) ? "Companies created successfully" : "Company created successfully";

    return successResponse(responseData, message, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
