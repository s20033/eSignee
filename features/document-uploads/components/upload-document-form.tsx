"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_UPLOAD_SIZE_BYTES } from "../schema";
import { uploadDocumentForSignature } from "../actions";

const MAX_SIZE_LABEL = "2 MB";

export const UploadDocumentForm = () => {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.size > MAX_UPLOAD_SIZE_BYTES) {
      setFileError(`File must be ${MAX_SIZE_LABEL} or smaller.`);
      event.target.value = "";
    } else {
      setFileError(null);
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setFileError("Choose a file to upload.");
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setFileError(`File must be ${MAX_SIZE_LABEL} or smaller.`);
      return;
    }

    startTransition(async () => {
      const result = await uploadDocumentForSignature(formData);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload a document for signature</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="e.g. Leave request form" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">File (PDF, max {MAX_SIZE_LABEL})</Label>
            <Input id="file" name="file" type="file" accept="application/pdf" onChange={onFileChange} />
            {fileError && <p className="text-sm text-destructive">{fileError}</p>}
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Uploading..." : "Upload"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
