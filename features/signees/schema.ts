import { z } from "zod";

export const signeeFormSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(200),
  email: z.string().trim().email("Enter a valid email"),
  companyName: z.string().trim().max(200).optional().or(z.literal("")),
});

export type SigneeFormValues = z.infer<typeof signeeFormSchema>;

export const emptySigneeFormValues: SigneeFormValues = {
  fullName: "",
  email: "",
  companyName: "",
};

/** Shared by createSignee/updateSignee — maps the form's string fields onto the signees table's typed columns. */
export const toSigneeInsertValues = (data: SigneeFormValues, employerId: string, tenantId: string) => ({
  employerId,
  tenantId,
  fullName: data.fullName,
  email: data.email,
  companyName: data.companyName || null,
});
