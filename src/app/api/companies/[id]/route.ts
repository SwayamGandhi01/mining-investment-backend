import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Company from "@/models/Company";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";
import { companySchema } from "@/lib/validations/company";
import { formatZodErrors } from "@/lib/validators";
import { isValidObjectId } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const query = isValidObjectId(id) ? { _id: id } : { slug: id };

    const company = await Company.findOne({ ...query, isDeleted: false }).lean();
    if (!company) return errorResponse("Company not found", 404);

    return successResponse(company);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;

    const body = await request.json();
    const validation = companySchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
    }

    const company = await Company.findById(id);
    if (!company || company.isDeleted) return errorResponse("Company not found", 404);

    let slug = company.slug;
    if (validation.data.name !== company.name) {
      slug = await ensureUniqueSlug(generateSlug(validation.data.name), "Company", id);
    }

    Object.assign(company, validation.data, { slug });
    await company.save();

    return successResponse(company, "Company updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;

    const body = await request.json();
    const company = await Company.findByIdAndUpdate(id, body, { new: true });
    if (!company || company.isDeleted) return errorResponse("Company not found", 404);

    return successResponse(company, "Company updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    await dbConnect();
    const { id } = await params;

    const company = await Company.findByIdAndDelete(id);
    if (!company) return errorResponse("Company not found", 404);

    return successResponse(null, "Company deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
