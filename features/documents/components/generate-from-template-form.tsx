"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateDocumentsFromTemplates } from "../actions";

type TemplateOption = { id: string; name: string; placeholders: string[] };

type GenerateFromTemplateFormProps = {
  employeeId: string;
  templates: TemplateOption[];
};

const SIGNATURE_OPTIONS = [
  { value: "employee", label: "Employee signs" },
  { value: "employer", label: "Employer signs" },
  { value: "two-party", label: "Both sign" },
] as const;

export const GenerateFromTemplateForm = ({ employeeId, templates }: GenerateFromTemplateFormProps) => {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [signatureType, setSignatureType] = useState<(typeof SIGNATURE_OPTIONS)[number]["value"]>("employee");
  const [values, setValues] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uniquePlaceholders = useMemo(() => {
    const selected = templates.filter((template) => selectedIds.includes(template.id));
    return Array.from(new Set(selected.flatMap((template) => template.placeholders)));
  }, [templates, selectedIds]);

  if (templates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No templates yet — create one under Templates first.
      </p>
    );
  }

  const toggleTemplate = (templateId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? [...current, templateId] : current.filter((id) => id !== templateId),
    );
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null);

    if (selectedIds.length === 0) {
      setServerError("Select at least one template.");
      return;
    }

    setIsSubmitting(true);
    const result = await generateDocumentsFromTemplates(employeeId, {
      templateIds: selectedIds,
      signatureType,
      values,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    setSelectedIds([]);
    setValues({});
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label>Templates to generate</Label>
        <div className="space-y-2 rounded-lg border p-3">
          {templates.map((template) => (
            <Label key={template.id} className="flex w-fit items-center gap-2 font-normal">
              <Checkbox
                checked={selectedIds.includes(template.id)}
                onCheckedChange={(checked) => toggleTemplate(template.id, checked === true)}
              />
              {template.name}
            </Label>
          ))}
        </div>
      </div>

      {uniquePlaceholders.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {uniquePlaceholders.map((placeholder) => (
            <div key={placeholder} className="space-y-2">
              <Label htmlFor={`placeholder-${placeholder}`}>{placeholder}</Label>
              <Input
                id={`placeholder-${placeholder}`}
                value={values[placeholder] ?? ""}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [placeholder]: event.target.value }))
                }
              />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="signatureType">Who needs to sign</Label>
        <Select value={signatureType} onValueChange={(value) => setSignatureType(value as typeof signatureType)}>
          <SelectTrigger id="signatureType" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SIGNATURE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? "Generating..."
          : `Generate & send${selectedIds.length > 1 ? ` (${selectedIds.length} documents)` : ""}`}
      </Button>
    </form>
  );
};
