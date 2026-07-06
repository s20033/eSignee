export const DashboardFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="shrink-0 border-t px-4 py-4 text-xs text-muted-foreground md:px-6">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p>© {year} eSignee® by Polixnov Logistics. All rights reserved.</p>
        <p>Documents generated and signed comply with GDPR data handling requirements.</p>
      </div>
    </footer>
  );
};
