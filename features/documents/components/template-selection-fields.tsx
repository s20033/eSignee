import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type TemplateOption = { id: string; name: string; placeholders: string[] };

type TemplateSelectionFieldsProps = {
  templates: TemplateOption[];
  selectedIds: string[];
  onToggleTemplate: (templateId: string, checked: boolean) => void;
  uniquePlaceholders: string[];
  values: Record<string, string>;
  onValueChange: (placeholder: string, value: string) => void;
};

/** Template checklist + the placeholder inputs it reveals — shared by the employee and signee "generate from template" forms. */
export const TemplateSelectionFields = ({
  templates,
  selectedIds,
  onToggleTemplate,
  uniquePlaceholders,
  values,
  onValueChange,
}: TemplateSelectionFieldsProps) => (
  <>
    <div className="space-y-2">
      <Label>Templates to generate</Label>
      <div className="space-y-2 rounded-lg border p-3">
        {templates.map((template) => (
          <Label key={template.id} className="flex w-fit items-center gap-2 font-normal">
            <Checkbox
              checked={selectedIds.includes(template.id)}
              onCheckedChange={(checked) => onToggleTemplate(template.id, checked === true)}
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
              onChange={(event) => onValueChange(placeholder, event.target.value)}
            />
          </div>
        ))}
      </div>
    )}
  </>
);
