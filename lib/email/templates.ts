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
    <p>Hello ${params.employeeName},</p>
    <p>${params.companyName} has sent you the following document(s) to review and sign electronically:</p>
    <ul>
      ${params.documents
        .map((doc) => `<li><a href="${doc.signingUrl}">${doc.title}</a></li>`)
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
    <p>${params.employeeName} has signed <strong>${params.documentTitle}</strong>.</p>
    <p>Sign in to your dashboard to add your signature and complete the document:</p>
    <p><a href="${params.dashboardUrl}">${params.dashboardUrl}</a></p>
  `);

export const documentCompletedEmail = (params: { documentTitle: string; recipientName: string }) =>
  wrapper(`
    <h2>Document completed</h2>
    <p>Hello ${params.recipientName},</p>
    <p><strong>${params.documentTitle}</strong> has been signed by all parties and is now complete.</p>
  `);
