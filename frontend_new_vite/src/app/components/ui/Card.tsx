import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div 
      className={cn(
        "rounded-xl border border-slate-700 bg-[#1E293B] shadow-sm text-slate-50",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}
