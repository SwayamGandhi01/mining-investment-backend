import { NextResponse } from "next/server";

/**
 * Standard API response interfaces
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ field?: string; message: string }>;
}

export interface ApiPaginatedResponse<T = unknown> {
  success: true;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Create a success response.
 */
export function successResponse<T>(
  data: T,
  message: string = "Operation completed successfully",
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      message,
      data,
    },
    { status }
  );
}

/**
 * Create an error response.
 */
export function errorResponse(
  message: string = "An error occurred",
  status: number = 500,
  errors?: Array<{ field?: string; message: string }>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      message,
      errors,
    },
    { status }
  );
}

/**
 * Create a validation error response from Zod errors.
 */
export function validationErrorResponse(
  errors: Array<{ field?: string; message: string }>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      message: "Validation failed",
      errors,
    },
    { status: 400 }
  );
}

/**
 * Create a paginated response.
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message: string = "Data retrieved successfully"
): NextResponse<ApiPaginatedResponse<T>> {
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json(
    {
      success: true as const,
      message,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
    { status: 200 }
  );
}

/**
 * Handle unexpected errors consistently.
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error("API Error:", error);

  // MongoDB duplicate key error
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  ) {
    return errorResponse("A record with this value already exists", 409);
  }

  // MongoDB validation error
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "ValidationError"
  ) {
    return errorResponse("Database validation failed", 400);
  }

  // Authentication errors
  if (error instanceof Error) {
    if (error.message === "Authentication required") {
      return errorResponse("Authentication required", 401);
    }
    if (error.message === "Insufficient permissions") {
      return errorResponse("Insufficient permissions", 403);
    }
    return errorResponse(error.message, 500);
  }

  return errorResponse("An unexpected error occurred", 500);
}
