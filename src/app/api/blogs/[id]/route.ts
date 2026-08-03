import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { successResponse, errorResponse, handleApiError } from "@/lib/response";
import { blogSchema } from "@/lib/validations/blog";
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

    const blog = await Blog.findOne({ ...query, isDeleted: false }).populate("author", "name email").lean();
    if (!blog) return errorResponse("Blog post not found", 404);

    return successResponse(blog);
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
    const validation = blogSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Validation failed", 400, formatZodErrors(validation.error));
    }

    const blog = await Blog.findById(id);
    if (!blog || blog.isDeleted) return errorResponse("Blog post not found", 404);

    let slug = blog.slug;
    if (validation.data.title !== blog.title) {
      slug = await ensureUniqueSlug(generateSlug(validation.data.title), "Blog", id);
    }

    Object.assign(blog, validation.data, { slug });
    await blog.save();

    return successResponse(blog, "Blog post updated successfully");
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
    const blog = await Blog.findByIdAndUpdate(id, body, { new: true });
    if (!blog || blog.isDeleted) return errorResponse("Blog post not found", 404);

    return successResponse(blog, "Blog post updated successfully");
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

    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) return errorResponse("Blog post not found", 404);

    return successResponse(null, "Blog post deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
