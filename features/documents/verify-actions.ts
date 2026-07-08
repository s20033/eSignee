"use server";

import { getVerificationInfo as getVerificationInfoService } from "@/lib/documents/verification-service";

export const getVerificationInfo = async (documentId: string) => getVerificationInfoService(documentId);
