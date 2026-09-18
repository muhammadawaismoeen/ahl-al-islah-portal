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

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  /** Email of the Owner who added this user, for an audit trail. */
  addedBy: string;
  createdAt: string;
}
