import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: 'success' | 'warning' | 'danger' | 'neutral';
}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  const variants = {
    success: "bg-green-500/10 text-green-500 border-green-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    danger: "bg-red-500/10 text-red-500 border-red-500/20",
    neutral: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )} 
      {...props}
    >
      {children}
    </span>
  );
}
