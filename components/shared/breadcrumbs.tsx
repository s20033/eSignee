import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

type Crumb = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: Crumb[];
};

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => (
  <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
    {items.map((item, index) => (
      <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
        {index > 0 && <ChevronRightIcon className="size-3.5 shrink-0" />}
        {item.href ? (
          <Link href={item.href} className="transition-colors hover:text-foreground">
            {item.label}
          </Link>
        ) : (
          <span className="font-medium text-foreground">{item.label}</span>
        )}
      </span>
    ))}
  </nav>
);
