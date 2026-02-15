import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
}

export function Button({ 
  className, 
  variant = 'primary', 
  fullWidth, 
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-[#2563EB] text-white hover:bg-[#1d4ed8] focus:ring-[#2563EB]",
    secondary: "bg-transparent border border-[#94A3B8] text-[#F8FAFC] hover:bg-[#1E293B] focus:ring-[#94A3B8]",
    ghost: "bg-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]"
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
