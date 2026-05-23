export const ACTIVITY_CATEGORIES = [
  "camp",
  "sports",
  "school",
  "music",
  "stem",
  "art",
  "playdate",
  "doctor",
  "travel",
  "other"
] as const;

export const VISIBILITY_LEVELS = [
  "family",
  "selected_parents",
  "friend_group",
  "class_group",
  "school_group",
  "public_listing"
] as const;

export const CARPOOL_DIRECTIONS = ["dropoff", "pickup", "both"] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];
export type VisibilityLevel = (typeof VISIBILITY_LEVELS)[number];
export type CarpoolDirection = (typeof CARPOOL_DIRECTIONS)[number];

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface ConflictWarning {
  id: string;
  title: string;
  source: "external_calendar" | "sibling_activity" | "travel_time" | "parent_unavailable";
  severity: "low" | "medium" | "high";
  startAt: string;
  endAt: string;
  message: string;
}

export interface CalendarExportScope {
  type: "family" | "child" | "carpool";
  childId?: string;
}
