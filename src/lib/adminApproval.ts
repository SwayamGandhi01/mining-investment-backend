import type { IAdmin } from "@/models/Admin";

/**
 * Accounts created before the approval flow existed carry no `status` field.
 * Everywhere that asks "is this account approved?" must treat a missing status
 * as approved, or the original superadmin would be locked out.
 */
export const APPROVED_FILTER: Record<string, unknown> = {
  $or: [{ status: { $exists: false } }, { status: "approved" }],
};

/** True when the account may sign in — i.e. not awaiting review and not rejected. */
export function isApprovedStatus(status?: string | null): boolean {
  return status === undefined || status === null || status === "approved";
}

/** Shape returned for a pending signup request. Never includes the password. */
export function toRequestSummary(admin: IAdmin) {
  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    requestedAt: admin.createdAt,
  };
}
