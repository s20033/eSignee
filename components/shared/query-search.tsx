"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

type QuerySearchProps = {
  placeholder: string;
};

export const QuerySearch = ({ placeholder }: QuerySearchProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  const onChange = (next: string) => {
    setValue(next);
    const params = new URLSearchParams(searchParams.toString());

    if (next) {
      params.set("q", next);
    } else {
      params.delete("q");
    }
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="max-w-xs"
    />
  );
};
