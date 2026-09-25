import React from 'react';

interface HairlineProps {
  className?: string;
}

export function Hairline({ className = '' }: HairlineProps) {
  return (
    <div
      role="separator"
      className={`w-full h-[1px] bg-[#E3DFD7] ${className}`}
    />
  );
}
