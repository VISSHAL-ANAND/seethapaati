import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'solid',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-sans tracking-[0.05em] uppercase transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#181513] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'text-[11px] py-2 px-4',
    md: 'text-[12px] py-3.5 px-7',
    lg: 'text-[13px] py-4 px-9 font-medium',
  };

  const variantStyles = {
    solid: 'bg-[#181513] text-[#F7F5F0] hover:bg-[#2E2824]',
    outline: 'border border-[#181513] text-[#181513] hover:bg-[#181513] hover:text-[#F7F5F0]',
    ghost: 'text-[#181513] hover:bg-neutral-200/50',
    underline: 'text-[#181513] underline underline-offset-4 hover:opacity-70 p-0',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block animate-pulse">Processing...</span>
      ) : (
        children
      )}
    </button>
  );
}
