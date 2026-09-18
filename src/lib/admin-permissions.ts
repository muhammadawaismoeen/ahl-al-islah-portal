import type { AdminRole, AdminSection } from "./admin-types";

export const ADMIN_ROLES: AdminRole[] = [
  "owner",
  "drive-manager",
  "content-programming",
  "community-care",
  "people-ops",
];

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  owner: "Owner",
  "drive-manager": "Drive Manager",
  "content-programming": "Content & Programming",
  "community-care": "Community Care",
  "people-ops": "People Ops",
};

export const ADMIN_ROLE_DESCRIPTION: Record<AdminRole, string> = {
  owner: "Full access to every section, including managing admin users.",
  "drive-manager":
    "Qur'an & Seerah Drive only — drives, applicants, donations, ambassadors, payments.",
  "content-programming": "Sessions, Positions, and the Content Editor.",
  "community-care": "Inbox, Feedback, Counsel, and Activity Audits.",
  "people-ops": "Core Members and Heads.",
};

const ROLE_SECTIONS: Record<AdminRole, AdminSection[]> = {
  owner: ["people", "community", "programming", "drive", "users"],
  "drive-manager": ["drive"],
  "content-programming": ["programming"],
  "community-care": ["community"],
  "people-ops": ["people"],
};

export function roleHasSection(role: AdminRole, section: AdminSection): boolean {
  return ROLE_SECTIONS[role].includes(section);
}

export function sectionsForRole(role: AdminRole): AdminSection[] {
  return ROLE_SECTIONS[role];
}
