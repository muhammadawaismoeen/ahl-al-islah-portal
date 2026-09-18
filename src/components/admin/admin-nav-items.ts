import {
  Users,
  Crown,
  MessageCircle,
  MessageSquareHeart,
  LifeBuoy,
  ClipboardList,
  CalendarDays,
  BookOpen,
  Briefcase,
  Pencil,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { AdminSection } from "@/lib/admin-types";

export type AdminBadgeKey =
  | "messages"
  | "feedback"
  | "activities"
  | "counsel"
  | "drive";

export interface AdminNavItem {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
  section: AdminSection;
  badgeKey?: AdminBadgeKey;
}

export interface AdminNavGroup {
  key: AdminSection;
  label: string;
  items: AdminNavItem[];
}

/**
 * Macro (group) → micro (item) structure so the sidebar reads as a map of
 * the admin surface, not a flat list of 10+ unrelated links. Groups double
 * as the unit `roleHasSection` gates — a role either sees a whole group or
 * none of it.
 */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    key: "people",
    label: "People",
    items: [
      { key: "core-members", href: "/admin", label: "Core Members", icon: Users, section: "people" },
      { key: "heads", href: "/admin/heads", label: "Heads", icon: Crown, section: "people" },
    ],
  },
  {
    key: "community",
    label: "Community Care",
    items: [
      {
        key: "messages",
        href: "/admin/messages",
        label: "Inbox",
        icon: MessageCircle,
        section: "community",
        badgeKey: "messages",
      },
      {
        key: "feedback",
        href: "/admin/feedback",
        label: "Feedback",
        icon: MessageSquareHeart,
        section: "community",
        badgeKey: "feedback",
      },
      {
        key: "counsel",
        href: "/admin/counsel",
        label: "Counsel",
        icon: LifeBuoy,
        section: "community",
        badgeKey: "counsel",
      },
      {
        key: "activity-submissions",
        href: "/admin/activity-submissions",
        label: "Audits",
        icon: ClipboardList,
        section: "community",
        badgeKey: "activities",
      },
    ],
  },
  {
    key: "programming",
    label: "Programming & Content",
    items: [
      { key: "sessions", href: "/admin/sessions", label: "Sessions", icon: CalendarDays, section: "programming" },
      { key: "positions", href: "/admin/positions", label: "Positions", icon: Briefcase, section: "programming" },
      { key: "content", href: "/admin/content", label: "Content Editor", icon: Pencil, section: "programming" },
    ],
  },
  {
    key: "drive",
    label: "Qur'an & Seerah Drive",
    items: [
      {
        key: "drive",
        href: "/admin/drive",
        label: "Drive Console",
        icon: BookOpen,
        section: "drive",
        badgeKey: "drive",
      },
    ],
  },
  {
    key: "users",
    label: "Administration",
    items: [
      { key: "users", href: "/admin/users", label: "Users & Roles", icon: UsersRound, section: "users" },
    ],
  },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);
