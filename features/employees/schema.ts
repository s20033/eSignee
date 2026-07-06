import { z } from "zod";

const numericString = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || !Number.isNaN(Number(value)), `${label} must be a number`);

const isValidPesel = (pesel: string) => {
  if (!/^\d{11}$/.test(pesel)) return false;
  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  const digits = pesel.split("").map(Number);
  const sum = weights.reduce((acc, weight, index) => acc + weight * digits[index], 0);
  const checksum = (10 - (sum % 10)) % 10;
  return checksum === digits[10];
};

const isValidIban = (iban: string) => {
  const clean = iban.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z0-9]+$/.test(clean) || clean.length < 15 || clean.length > 34) return false;
  if (clean.startsWith("PL") && clean.length !== 28) return false;
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  const numeric = rearranged
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      return code >= 65 && code <= 90 ? String(code - 55) : char;
    })
    .join("");
  return BigInt(numeric) % BigInt(97) === BigInt(1);
};

export const employeeFormSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required").max(200),
    email: z.string().trim().email("Enter a valid email"),
    position: z.string().trim().max(200).optional().or(z.literal("")),
    salary: numericString("Salary"),
    startDate: z.string().trim().optional().or(z.literal("")),
    endDate: z.string().trim().optional().or(z.literal("")),

    passportNumber: z.string().trim().max(20).optional().or(z.literal("")),
    pesel: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((value) => !value || isValidPesel(value), "Invalid PESEL number"),
    nationality: z.string().trim().max(100).optional().or(z.literal("")),
    address: z.string().trim().max(500).optional().or(z.literal("")),

    bankName: z.string().trim().max(200).optional().or(z.literal("")),
    iban: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((value) => !value || isValidIban(value), "Invalid IBAN number"),

    jobDescription: z.string().trim().max(2000).optional().or(z.literal("")),
    hourlyRate: numericString("Hourly rate"),
    minHoursPerWeek: numericString("Minimum hours per week"),
    accommodationCost: numericString("Accommodation cost"),

    isForeigner: z.boolean(),
    citizenship: z.string().trim().max(100).optional().or(z.literal("")),
    foreignerDocumentType: z.enum(["visa", "residence_card", "other"]).optional(),
    foreignerDocumentNumber: z.string().trim().max(50).optional().or(z.literal("")),
    foreignerDocumentExpiry: z.string().trim().optional().or(z.literal("")),
    workBasis: z.string().trim().max(200).optional().or(z.literal("")),

    isStudent: z.boolean(),
  })
  .refine((data) => !data.endDate || !data.startDate || data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .refine((data) => !data.isForeigner || !!data.citizenship, {
    message: "Citizenship is required",
    path: ["citizenship"],
  })
  .refine((data) => !data.isForeigner || !!data.foreignerDocumentNumber, {
    message: "Document number is required",
    path: ["foreignerDocumentNumber"],
  })
  .refine((data) => !data.isForeigner || !!data.foreignerDocumentExpiry, {
    message: "Document expiry date is required",
    path: ["foreignerDocumentExpiry"],
  })
  .refine((data) => !data.isForeigner || !!data.workBasis, {
    message: "Work basis is required",
    path: ["workBasis"],
  });

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
