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
  type LucideIcon,
} from "lucide-react";

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
  badgeKey?: AdminBadgeKey;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { key: "core-members", href: "/admin", label: "Core Members", icon: Users },
  { key: "heads", href: "/admin/heads", label: "Heads", icon: Crown },
  {
    key: "messages",
    href: "/admin/messages",
    label: "Inbox",
    icon: MessageCircle,
    badgeKey: "messages",
  },
  {
    key: "feedback",
    href: "/admin/feedback",
    label: "Feedback",
    icon: MessageSquareHeart,
    badgeKey: "feedback",
  },
  {
    key: "counsel",
    href: "/admin/counsel",
    label: "Counsel",
    icon: LifeBuoy,
    badgeKey: "counsel",
  },
  {
    key: "activity-submissions",
    href: "/admin/activity-submissions",
    label: "Audits",
    icon: ClipboardList,
    badgeKey: "activities",
  },
  { key: "sessions", href: "/admin/sessions", label: "Sessions", icon: CalendarDays },
  {
    key: "drive",
    href: "/admin/drive",
    label: "Drive",
    icon: BookOpen,
    badgeKey: "drive",
  },
  { key: "positions", href: "/admin/positions", label: "Positions", icon: Briefcase },
  { key: "content", href: "/admin/content", label: "Content Editor", icon: Pencil },
];
