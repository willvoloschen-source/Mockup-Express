/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:bg-indigo-800",
    secondary: "bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm active:bg-slate-100",
    outline: "bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100",
    ghost: "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm active:bg-red-800",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon ? (
        <span className="mr-2 inline-flex items-center">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};