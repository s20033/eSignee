// These templates interpolate values that can originate from user-entered
// form fields (an employee's self-registration name, an uploaded document's
// title, a rejection reason) into raw HTML with no framework auto-escaping
// in between — unlike React/JSX, a template literal does nothing to stop
// "<img src=x onerror=...>" from landing verbatim in an admin's inbox.
// Every such value must go through this before interpolation.
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const wrapper = (bodyHtml: string) => `
  <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
    ${bodyHtml}
    <p style="color: #888; font-size: 12px; margin-top: 32px;">
      This is an automated message from eSignee® by Polixnov Logistics on behalf of your employer.
    </p>
  </div>
`;

export const signingInvitationEmail = (params: {
  employeeName: string;
  companyName: string;
  documents: { title: string; signingUrl: string }[];
}) =>
  wrapper(`
    <h2>You have documents to sign</h2>
    <p>Hello ${escapeHtml(params.employeeName)},</p>
    <p>${escapeHtml(params.companyName)} has sent you the following document(s) to review and sign electronically:</p>
    <ul>
      ${params.documents
        .map((doc) => `<li><a href="${doc.signingUrl}">${escapeHtml(doc.title)}</a></li>`)
        .join("")}
    </ul>
    <p>No account or login is required — just open the link for each document.</p>
  `);

export const employerSignatureNeededEmail = (params: {
  documentTitle: string;
  employeeName: string;
  dashboardUrl: string;
}) =>
  wrapper(`
    <h2>A document is ready for your signature</h2>
    <p>${escapeHtml(params.employeeName)} has signed <strong>${escapeHtml(params.documentTitle)}</strong>.</p>
    <p>Sign in to your dashboard to add your signature and complete the document:</p>
    <p><a href="${params.dashboardUrl}">${params.dashboardUrl}</a></p>
  `);

export const documentCompletedEmail = (params: { documentTitle: string; recipientName: string }) =>
  wrapper(`
    <h2>Document completed</h2>
    <p>Hello ${escapeHtml(params.recipientName)},</p>
    <p><strong>${escapeHtml(params.documentTitle)}</strong> has been signed by all parties and is now complete.</p>
  `);

export const employeeAccountPendingEmail = (params: { employeeName: string; approvalsUrl: string }) =>
  wrapper(`
    <h2>New account request</h2>
    <p><strong>${escapeHtml(params.employeeName)}</strong> has requested access and is waiting for your approval.</p>
    <p><a href="${params.approvalsUrl}">Review pending requests</a></p>
  `);

export const employeeAccountApprovedEmail = (params: { employeeName: string; companyName: string }) =>
  wrapper(`
    <h2>Your account is approved</h2>
    <p>Hello ${escapeHtml(params.employeeName)},</p>
    <p>${escapeHtml(params.companyName)} has approved your account. You can now sign in.</p>
  `);

export const employeeAccountRejectedEmail = (params: {
  employeeName: string;
  companyName: string;
  reason: string;
}) =>
  wrapper(`
    <h2>Account request not approved</h2>
    <p>Hello ${escapeHtml(params.employeeName)},</p>
    <p>${escapeHtml(params.companyName)} was not able to approve your account request.</p>
    <p><strong>Reason:</strong> ${escapeHtml(params.reason)}</p>
  `);

export const documentUploadedForSignatureEmail = (params: {
  employeeName: string;
  documentTitle: string;
  dashboardUrl: string;
}) =>
  wrapper(`
    <h2>A document needs your signature</h2>
    <p><strong>${escapeHtml(params.employeeName)}</strong> uploaded <strong>${escapeHtml(params.documentTitle)}</strong> for you to review and sign.</p>
    <p><a href="${params.dashboardUrl}">Review and sign</a></p>
  `);

export const identityDocumentExpiringAdminEmail = (params: {
  employeeName: string;
  documentTypeLabel: string;
  daysUntilExpiry: number;
  complianceUrl: string;
}) =>
  wrapper(`
    <h2>Document expiring soon</h2>
    <p><strong>${escapeHtml(params.employeeName)}</strong>'s ${escapeHtml(params.documentTypeLabel.toLowerCase())} expires in
    <strong>${params.daysUntilExpiry} day${params.daysUntilExpiry === 1 ? "" : "s"}</strong>.</p>
    <p><a href="${params.complianceUrl}">View compliance dashboard</a></p>
  `);

export const identityDocumentExpiringEmployeeEmail = (params: {
  employeeName: string;
  documentTypeLabel: string;
  daysUntilExpiry: number;
}) =>
  wrapper(`
    <h2>Your ${escapeHtml(params.documentTypeLabel.toLowerCase())} is expiring soon</h2>
    <p>Hello ${escapeHtml(params.employeeName)},</p>
    <p>Your ${escapeHtml(params.documentTypeLabel.toLowerCase())} on file expires in
    <strong>${params.daysUntilExpiry} day${params.daysUntilExpiry === 1 ? "" : "s"}</strong>. Please renew it and
    upload the updated document as soon as possible.</p>
  `);
