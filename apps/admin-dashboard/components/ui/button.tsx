import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyle = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";
    
    const variants = {
      default: "bg-[#10B981] text-white shadow hover:bg-[#059669]",
      destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700",
      outline: "border border-neutral-200 bg-white shadow-sm hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-neutral-50",
      secondary: "bg-neutral-100 text-neutral-900 shadow-sm hover:bg-neutral-100/80 dark:bg-zinc-800 dark:text-neutral-50 dark:hover:bg-zinc-800/80",
      ghost: "hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-zinc-850 dark:hover:text-neutral-50",
      link: "text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-50",
    };
    
    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8",
      icon: "h-9 w-9",
    };
    
    return (
      <button
        className={cn(baseStyle, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
