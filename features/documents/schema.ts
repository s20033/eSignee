import { z } from "zod";

const numericString = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || !Number.isNaN(Number(value)), `${label} must be a number`);

export const contractBuilderSchema = z.object({
  contractType: z.enum(["zlecenie", "o_prace"]),
  positionId: z.string().optional().or(z.literal("")),
  customPositionName: z.string().trim().max(200).optional().or(z.literal("")),
  customPositionDescription: z.string().trim().max(2000).optional().or(z.literal("")),
  startDate: z.string().trim().min(1, "Start date is required"),
  endDate: z.string().trim().optional().or(z.literal("")),
  hourlyRate: numericString("Hourly rate"),
  minHours: numericString("Minimum hours"),
  monthlyWage: numericString("Monthly wage"),
  weeklyHours: numericString("Weekly hours"),
  paymentMethod: z.string().trim().max(100).optional().or(z.literal("")),
});

export type ContractBuilderValues = z.infer<typeof contractBuilderSchema>;

export const generateFromTemplatesSchema = z.object({
  templateIds: z.array(z.string().uuid()).min(1, "Select at least one template"),
  signatureType: z.enum(["employee", "employer", "two-party"]),
  // Keyed by placeholder name, shared across every selected template — a
  // placeholder with the same name in two templates is filled once.
  values: z.record(z.string(), z.string().trim().max(2000)),
});

export type GenerateFromTemplatesValues = z.infer<typeof generateFromTemplatesSchema>;
