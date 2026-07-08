import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteTemplateDialog } from "./delete-template-dialog";
import { documentCategoryLabel } from "@/lib/documents/category-labels";
import type { Template } from "@/types/template";

type TemplateTableProps = {
  templates: Template[];
};

export const TemplateTable = ({ templates }: TemplateTableProps) => {
  if (templates.length === 0) {
    return <p className="text-sm text-muted-foreground">No templates found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Placeholders</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.map((template) => {
          const placeholders = Array.isArray(template.placeholders)
            ? (template.placeholders as string[])
            : [];

          return (
            <TableRow key={template.id}>
              <TableCell>{template.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{documentCategoryLabel(template)}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {placeholders.length > 0 ? placeholders.join(", ") : "—"}
              </TableCell>
              <TableCell className="space-x-2 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/dashboard/templates/${template.id}/edit`} />}
                >
                  Edit
                </Button>
                <DeleteTemplateDialog templateId={template.id} templateName={template.name} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
