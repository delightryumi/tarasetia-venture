import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyle = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer shrink-0";
    
    const variants = {
      default: "bg-zinc-900 text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200",
      destructive: "bg-red-600 text-white shadow-xs hover:bg-red-700",
      outline: "border border-zinc-300 bg-white text-zinc-800 shadow-xs hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
      secondary: "bg-zinc-100 text-zinc-900 shadow-xs hover:bg-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700",
      ghost: "hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
      link: "text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50",
    };
    
    const sizes = {
      default: "h-9 px-4 py-2 gap-2",
      sm: "h-8 rounded-md px-4 text-xs gap-2 shrink-0",
      lg: "h-10 rounded-md px-6 gap-2.5",
      icon: "h-9 w-9 p-0",
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
