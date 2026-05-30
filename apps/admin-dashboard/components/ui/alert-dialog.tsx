import React from 'react';
import { cn } from "@/lib/utils";

interface AlertDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function AlertDialog({ open, children }: AlertDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      {children}
    </div>
  );
}

export function AlertDialogContent({ className, children }: { className?: string, children: React.ReactNode }) {
  return (
    <div className={cn("bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-white/[0.1] rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in relative", className)}>
      {children}
    </div>
  );
}

export function AlertDialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2 mb-4">{children}</div>;
}

export function AlertDialogTitle({ className, children }: { className?: string, children: React.ReactNode }) {
  return <h2 className={cn("text-lg font-bold text-neutral-900 dark:text-white", className)}>{children}</h2>;
}

export function AlertDialogDescription({ className, children }: { className?: string, children: React.ReactNode }) {
  return <p className={cn("text-sm text-neutral-500 dark:text-neutral-400", className)}>{children}</p>;
}

export function AlertDialogFooter({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6", className)}>{children}</div>;
}

export function AlertDialogCancel({ className, children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn("px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/[0.1] bg-gray-50 hover:bg-gray-100 text-neutral-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer select-none", className)}
      onClick={onClick}
      {...props}
    >
      {children || 'Batal'}
    </button>
  );
}

export function AlertDialogAction({ className, children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn("px-4 py-2 rounded-xl bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-xs font-semibold transition-colors cursor-pointer select-none", className)}
      onClick={onClick}
      {...props}
    >
      {children || 'Ya'}
    </button>
  );
}
