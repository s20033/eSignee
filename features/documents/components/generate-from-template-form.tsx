"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateDocumentFromTemplate } from "../actions";

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
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [signatureType, setSignatureType] = useState<(typeof SIGNATURE_OPTIONS)[number]["value"]>("employee");
  const [values, setValues] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (templates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No templates yet — create one under Templates first.
      </p>
    );
  }

  const selectedTemplate = templates.find((template) => template.id === templateId) ?? templates[0];

  const onTemplateChange = (nextId: string | null) => {
    if (!nextId) return;
    setTemplateId(nextId);
    setValues({});
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null);
    setIsSubmitting(true);

    const result = await generateDocumentFromTemplate(employeeId, {
      templateId: selectedTemplate.id,
      signatureType,
      values,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    setValues({});
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="templateId">Template</Label>
        <Select value={selectedTemplate.id} onValueChange={onTemplateChange}>
          <SelectTrigger id="templateId" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTemplate.placeholders.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {selectedTemplate.placeholders.map((placeholder) => (
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
        {isSubmitting ? "Generating..." : "Generate & send"}
      </Button>
    </form>
  );
};
