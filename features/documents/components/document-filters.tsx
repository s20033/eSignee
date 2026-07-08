import { QuerySelectFilter } from "@/components/shared/query-select-filter";
import { DOCUMENT_STATUS_LABELS } from "@/lib/documents/status-labels";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/documents/category-labels";

export const DocumentFilters = () => (
  <div className="flex gap-2">
    <QuerySelectFilter
      param="status"
      placeholder="All statuses"
      options={Object.entries(DOCUMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
    />
    <QuerySelectFilter
      param="category"
      placeholder="All categories"
      options={Object.entries(DOCUMENT_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
    />
  </div>
);
