import type { ApplicationResponse } from "./applicationsService";

/** Matches backend `submitAutoApplyApplications`: these block selecting again for auto-apply. */
export const AUTO_APPLY_BLOCKING_STATUSES = new Set(["pending", "accepted"]);

export function getAutoApplyBlockedDaycareIds(
  applications: ApplicationResponse[]
): Set<string> {
  const out = new Set<string>();
  for (const a of applications) {
    if (a.source !== "auto_apply" || !a.daycareId) continue;
    if (!AUTO_APPLY_BLOCKING_STATUSES.has(a.status)) continue;
    out.add(String(a.daycareId).trim());
  }
  return out;
}

export function collectAutoApplyDuplicateDaycareIds(
  selectedDaycareIds: string[],
  applications: ApplicationResponse[]
): string[] {
  const blocked = getAutoApplyBlockedDaycareIds(applications);
  const uniqueSelected = [
    ...new Set(selectedDaycareIds.map((id) => String(id).trim()).filter(Boolean)),
  ];
  return uniqueSelected.filter((id) => blocked.has(id));
}
