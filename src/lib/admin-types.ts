/**
 * Named admin roles + the sidebar sections they unlock. Shared between the
 * server-only admin-users-store and client components (AdminSidebar), so
 * this file stays free of `fs`/redis imports.
 */

export type AdminRole =
  | "owner"
  | "drive-manager"
  | "content-programming"
  | "community-care"
  | "people-ops";

export type AdminSection = "people" | "community" | "programming" | "drive" | "users";

/** Individual admin screens, each nested under one AdminSection. "users" has
 *  no features of its own — only Owners ever reach that section (see
 *  ROLE_SECTIONS in admin-permissions.ts), so per-feature tiers on it would
 *  be moot. */
export type AdminFeature =
  | "people.members"
  | "people.heads"
  | "community.messages"
  | "community.feedback"
  | "community.counsel"
  | "community.activity-audits"
  | "programming.sessions"
  | "programming.positions"
  | "programming.content"
  | "drive.drives"
  | "drive.catalog"
  | "drive.applicants"
  | "drive.checkin"
  | "drive.donations"
  | "drive.ambassadors"
  | "drive.payments"
  | "drive.report";

/** A tiered permission level, each including everything below it:
 *  none < read < edit < full. "full" adds delete/destructive actions on top
 *  of "edit". */
export type PermissionTier = "none" | "read" | "edit" | "full";

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  /** Email of the Owner who added this user, for an audit trail. */
  addedBy: string;
  createdAt: string;
  /** Per-feature overrides layered on top of the role's default: full access
   *  to every feature in the sections that role already grants. A feature
   *  whose section the role doesn't grant stays "none" no matter what's set
   *  here — see getFeatureTier in admin-permissions.ts. Absent/missing entries
   *  default to "full" (matches pre-existing behavior for records saved
   *  before this field existed). */
  permissionOverrides?: Partial<Record<AdminFeature, PermissionTier>>;
}
