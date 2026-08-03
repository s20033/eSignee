"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  IDENTITY_DOCUMENT_TYPES,
  IDENTITY_DOCUMENT_TYPE_LABELS,
  MAX_IDENTITY_DOCUMENT_SIZE_BYTES,
} from "../schema";
import { uploadIdentityDocument } from "../actions";

const MAX_SIZE_LABEL = "2 MB";

export const UploadIdentityDocumentForm = () => {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<string>("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.size > MAX_IDENTITY_DOCUMENT_SIZE_BYTES) {
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
    if (file.size > MAX_IDENTITY_DOCUMENT_SIZE_BYTES) {
      setFileError(`File must be ${MAX_SIZE_LABEL} or smaller.`);
      return;
    }

    startTransition(async () => {
      const result = await uploadIdentityDocument(formData);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      formRef.current?.reset();
      setType("");
      router.refresh();
    });
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Document type</Label>
          <Select value={type} onValueChange={(value) => setType(value ?? "")}>
            <SelectTrigger id="type" className="w-full">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              {IDENTITY_DOCUMENT_TYPES.map((value) => (
                <SelectItem key={value} value={value}>
                  {IDENTITY_DOCUMENT_TYPE_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="type" value={type} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="documentNumber">Document number</Label>
          <Input id="documentNumber" name="documentNumber" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="issuingCountry">Issuing country</Label>
          <Input id="issuingCountry" name="issuingCountry" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry date</Label>
          <Input id="expiryDate" name="expiryDate" type="date" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">File (max {MAX_SIZE_LABEL})</Label>
        <Input id="file" name="file" type="file" accept="image/*,.pdf" onChange={onFileChange} />
        {fileError && <p className="text-sm text-destructive">{fileError}</p>}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" disabled={isPending || !type}>
        {isPending ? "Uploading..." : "Upload"}
      </Button>
    </form>
  );
};
