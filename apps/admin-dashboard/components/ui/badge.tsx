import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-neutral-900 text-neutral-50 hover:bg-neutral-900/80 border-transparent",
    secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-100/80 border-transparent",
    destructive: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
    outline: "text-neutral-700 border-neutral-200 hover:bg-neutral-50",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    warning: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    />
  );
}
