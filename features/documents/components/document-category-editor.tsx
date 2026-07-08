"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DOCUMENT_CATEGORY_LABELS, type DocumentCategory } from "@/lib/documents/category-labels";
import { updateDocumentCategory } from "../actions";

type DocumentCategoryEditorProps = {
  documentId: string;
  category: DocumentCategory;
  customCategoryLabel: string | null;
};

export const DocumentCategoryEditor = ({
  documentId,
  category,
  customCategoryLabel,
}: DocumentCategoryEditorProps) => {
  const router = useRouter();
  const [value, setValue] = useState<DocumentCategory>(category);
  const [label, setLabel] = useState(customCategoryLabel ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty = value !== category || (value === "custom" && label !== (customCategoryLabel ?? ""));

  const onSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateDocumentCategory(documentId, value, value === "custom" ? label : null);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={value} onValueChange={(next) => setValue(next as DocumentCategory)}>
        <SelectTrigger size="sm">
          {/* Render function, not portal-rendered SelectItem lookup, so the closed trigger shows
              the right label (and the free-text custom label) even before the popup has mounted. */}
          <SelectValue>
            {(current: DocumentCategory) =>
              current === "custom" ? label || "Custom" : DOCUMENT_CATEGORY_LABELS[current]
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([option, optionLabel]) => (
            <SelectItem key={option} value={option}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value === "custom" && (
        <Input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Custom category name"
          className="h-7 w-40"
        />
      )}

      {dirty && (
        <Button size="sm" variant="outline" onClick={onSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};
