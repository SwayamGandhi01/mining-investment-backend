import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { getPaginationParams, buildSortQuery, buildSearchQuery, buildFilterQuery, getSkip } from "@/lib/pagination";
import { generateSlug, ensureUniqueSlug } from "@/lib/slug";
import { successResponse, paginatedResponse, errorResponse, handleApiError } from "@/lib/response";
import { blogSchema } from "@/lib/validations/blog";
import { formatZodErrors } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const params = getPaginationParams(request);
    const filter = buildFilterQuery(params, buildSearchQuery(params.search, ["title", "excerpt", "category"]));
    const sort = buildSortQuery(params);
    const skip = getSkip(params.page, params.limit);

    const [data, total] = await Promise.all([
      Blog.find(filter).sort(sort).skip(skip).limit(params.limit).populate("author", "name email").lean(),
      Blog.countDocuments(filter),
    ]);

    return paginatedResponse(data, total, params.page, params.limit);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await dbConnect();

    const body = await request.json();
    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      return errorResponse("At least one blog entry is required", 400);
    }

    const createdBlogs = [] as Array<any>;

    for (const item of items) {
      const validation = blogSchema.safeParse(item);

      if (!validation.success) {
        return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
      }

      const slug = await ensureUniqueSlug(generateSlug(validation.data.title), "Blog");

      const newBlog = await Blog.create({
        ...validation.data,
        slug,
        author: session.id,
      });

      createdBlogs.push(newBlog);
    }

    const responseData = Array.isArray(body) ? createdBlogs : createdBlogs[0];
    const message = Array.isArray(body) ? "Blog posts created successfully" : "Blog post created successfully";

    return successResponse(responseData, message, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
