import { QuerySelectFilter } from "@/components/shared/query-select-filter";
import { ExportCsvButton } from "./export-csv-button";
import { IDENTITY_DOCUMENT_TYPE_LABELS } from "../schema";

const STATUS_LABELS: Record<string, string> = {
  pending_review: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
};

export const ComplianceFilters = () => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex flex-wrap gap-2">
      <QuerySelectFilter
        param="type"
        placeholder="All types"
        options={Object.entries(IDENTITY_DOCUMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
      />
      <QuerySelectFilter
        param="status"
        placeholder="All statuses"
        options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
      />
      <QuerySelectFilter
        param="sort"
        placeholder="Soonest expiry first"
        options={[
          { value: "asc", label: "Soonest expiry first" },
          { value: "desc", label: "Latest expiry first" },
        ]}
      />
    </div>
    <ExportCsvButton />
  </div>
);
