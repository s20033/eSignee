import { z } from "zod";

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
