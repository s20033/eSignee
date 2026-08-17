"use client";

import { useMemo, useState } from "react";
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
import { generateDocumentsForSignee } from "../actions";
import { TemplateSelectionFields, type TemplateOption } from "./template-selection-fields";

type SigneeOption = { id: string; label: string };

type GenerateForSigneeFormProps = {
  signees: SigneeOption[];
  templates: TemplateOption[];
};

const SIGNATURE_OPTIONS = [
  { value: "employee", label: "Signee signs" },
  { value: "employer", label: "You sign" },
  { value: "two-party", label: "Both sign" },
] as const;

export const GenerateForSigneeForm = ({ signees, templates }: GenerateForSigneeFormProps) => {
  const router = useRouter();
  const [signeeId, setSigneeId] = useState<string>(signees[0]?.id ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [signatureType, setSignatureType] = useState<(typeof SIGNATURE_OPTIONS)[number]["value"]>("two-party");
  const [values, setValues] = useState<Record<string, string>>({});
  const [senderRoleLabel, setSenderRoleLabel] = useState("Zleceniodawca");
  const [counterpartyRoleLabel, setCounterpartyRoleLabel] = useState("Kontrahent");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uniquePlaceholders = useMemo(() => {
    const selected = templates.filter((template) => selectedIds.includes(template.id));
    return Array.from(new Set(selected.flatMap((template) => template.placeholders)));
  }, [templates, selectedIds]);

  if (signees.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No signees yet — add one under Signees first.
      </p>
    );
  }

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
    const result = await generateDocumentsForSignee(signeeId, {
      templateIds: selectedIds,
      signatureType,
      values,
      senderRoleLabel,
      counterpartyRoleLabel,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    setSelectedIds([]);
    setValues({});
    router.push("/dashboard/documents");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signeeId">Signee</Label>
        <Select value={signeeId} onValueChange={(value) => setSigneeId(value ?? "")}>
          <SelectTrigger id="signeeId" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {signees.map((signee) => (
              <SelectItem key={signee.id} value={signee.id}>
                {signee.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TemplateSelectionFields
        templates={templates}
        selectedIds={selectedIds}
        onToggleTemplate={toggleTemplate}
        uniquePlaceholders={uniquePlaceholders}
        values={values}
        onValueChange={(placeholder, value) => setValues((current) => ({ ...current, [placeholder]: value }))}
      />

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="senderRoleLabel">Your role label</Label>
          <Input id="senderRoleLabel" value={senderRoleLabel} onChange={(event) => setSenderRoleLabel(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="counterpartyRoleLabel">Signee&apos;s role label</Label>
          <Input
            id="counterpartyRoleLabel"
            value={counterpartyRoleLabel}
            onChange={(event) => setCounterpartyRoleLabel(event.target.value)}
          />
        </div>
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
