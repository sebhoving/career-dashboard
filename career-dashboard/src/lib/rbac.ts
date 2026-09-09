import type { Role } from "@/lib/types";

export type Permission =
  | "task:create"
  | "task:update"
  | "task:delete"
  | "plan:update"
  | "problem:update"
  | "milestone:update"
  | "application:update"
  | "export:csv";

const GRANTS: Record<Role, Permission[]> = {
  ADMIN: [
    "task:create",
    "task:update",
    "task:delete",
    "plan:update",
    "problem:update",
    "milestone:update",
    "application:update",
    "export:csv",
  ],
  VIEWER: ["export:csv"],
};

export function can(role: Role, permission: Permission) {
  return GRANTS[role].includes(permission);
}

/** Copy shown when a viewer hits a control they cannot use. */
export const VIEWER_HINT = "Mentors have read access. Ask Sebastian to make this change.";
