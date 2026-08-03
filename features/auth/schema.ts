import { z } from "zod";
import { employeeFormSchema } from "@/features/employees/schema";
import { TENANT_PLANS } from "@/lib/billing/plans";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signUpSchema = z
  .object({
    companyName: z.string().trim().min(1, "Company name is required").max(200),
    email: z.string().trim().email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
    plan: z.enum(TENANT_PLANS),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const mfaCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type MfaCodeFormValues = z.infer<typeof mfaCodeSchema>;

// Self-registration collects the same HR record an employer would otherwise
// enter by hand (features/employees/schema.ts::employeeFormSchema), plus the
// account credentials — so a tenant_admin approving a request has real data
// to review instead of just a name and email.
export const registerEmployeeSchema = z
  .intersection(
    employeeFormSchema,
    z.object({
      password: z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
    }),
  )
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterEmployeeFormValues = z.infer<typeof registerEmployeeSchema>;

export const rejectEmployeeSchema = z.object({
  reason: z.string().trim().min(1, "A reason is required").max(500),
});

export type RejectEmployeeFormValues = z.infer<typeof rejectEmployeeSchema>;
