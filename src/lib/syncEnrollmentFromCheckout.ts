import {
  ensureEnrollmentDraft,
  getEnrollmentByApplicationId,
  patchEnrollment,
} from "./enrollmentsService";
import { mergeEnrollmentPayload } from "./enrollmentFormUtils";
import type { EnrollmentPayload } from "./enrollmentsService";

/** After auto-apply, merge optional 3-step payload into each application's enrollment draft. */
export async function syncEnrollmentPayloadForApplications(
  applicationIds: string[],
  enrollmentPartial: Partial<EnrollmentPayload>
): Promise<void> {
  const hasData = enrollmentPartial && Object.keys(enrollmentPartial).length > 0;
  if (!hasData || applicationIds.length === 0) return;

  await Promise.all(
    applicationIds.map(async (applicationId) => {
      try {
        let res = await getEnrollmentByApplicationId(applicationId);
        if (!res.success) {
          res = await ensureEnrollmentDraft(applicationId);
        }
        if (!res.success || !res.data) return;

        const merged = mergeEnrollmentPayload(
          res.data.payload || {},
          enrollmentPartial
        );
        await patchEnrollment(res.data._id, merged);
      } catch (err) {
        console.warn(
          "[enrollment] checkout sync failed for application",
          applicationId,
          err
        );
      }
    })
  );
}
