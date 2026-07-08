"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ALL = "all";

type QuerySelectFilterProps = {
  param: string;
  placeholder: string;
  options: { value: string; label: string }[];
};

/** A Select bound to a URL search param — resets pagination on change. Shared by any list page that filters by one dimension (status, category, ...). */
export const QuerySelectFilter = ({ param, placeholder, options }: QuerySelectFilterProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === ALL) {
      params.delete(param);
    } else {
      params.set(param, value);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const labelsByValue = Object.fromEntries(options.map((option) => [option.value, option.label]));

  return (
    <Select value={searchParams.get(param) ?? ALL} onValueChange={onChange}>
      <SelectTrigger size="sm">
        {/* A render function, not portal-rendered SelectItem lookup, so the closed trigger
            shows the right label even before the popup has ever mounted. */}
        <SelectValue>{(value: string) => (value === ALL ? placeholder : (labelsByValue[value] ?? placeholder))}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
