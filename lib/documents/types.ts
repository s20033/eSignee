export type DocumentSection = {
  heading?: string;
  paragraphs?: string[];
  fields?: { label: string; value: string }[];
};

export type SignatureType = "two-party" | "employee" | "employer" | null;

export type GeneratedDocument = {
  id: string;
  title: string;
  legalBasis: string;
  signature: SignatureType;
  sections: DocumentSection[];
};

export type EmployeeContractData = {
  firstName: string;
  lastName: string;
  pesel?: string | null;
  passportNumber?: string | null;
  address?: string | null;
  nationality?: string | null;
  isForeigner: boolean;
  isStudent: boolean;
  citizenship?: string | null;
  foreignerDocumentType?: string | null;
  foreignerDocumentNumber?: string | null;
  foreignerDocumentExpiry?: string | null;
  workBasis?: string | null;
};

export type ContractInput = {
  type: "zlecenie" | "o_prace";
  startDate?: string | null;
  endDate?: string | null;
  hourlyRate?: string | null;
  minHours?: string | null;
  monthlyWage?: string | null;
  weeklyHours?: string | null;
  paymentMethod?: string | null;
};

export type PositionData = {
  namePl: string;
  occupationCode?: string;
  workplace?: string;
  fullDescription?: string;
} | null;

export type EmployerData = {
  name: string;
  address?: string | null;
  taxId?: string | null;
  regon?: string | null;
  krs?: string | null;
};

export type BundleInput = {
  employee: EmployeeContractData;
  contract: ContractInput;
  position: PositionData;
  employer: EmployerData;
};
