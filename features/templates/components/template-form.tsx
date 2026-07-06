"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTemplate, updateTemplate } from "../actions";
import { extractPlaceholders, templateFormSchema, type TemplateFormValues } from "../schema";

type TemplateFormProps = {
  templateId?: string;
  defaultValues?: TemplateFormValues;
};

export const TemplateForm = ({ templateId, defaultValues }: TemplateFormProps) => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: defaultValues ?? { name: "", content: "" },
  });

  const placeholders = extractPlaceholders(watch("content") ?? "");

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = templateId
      ? await updateTemplate(templateId, values)
      : await createTemplate(values);

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    router.push("/dashboard/templates");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          rows={14}
          placeholder="Dear {{employee_name}}, your position is {{position}}..."
          {...register("content")}
        />
        {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
        <p className="text-sm text-muted-foreground">
          Use <code>{"{{placeholder}}"}</code> tokens for values filled in when a document is
          generated.{" "}
          {placeholders.length > 0
            ? `Detected: ${placeholders.join(", ")}`
            : "No placeholders detected yet."}
        </p>
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {templateId ? "Save changes" : "Create template"}
      </Button>
    </form>
  );
};
