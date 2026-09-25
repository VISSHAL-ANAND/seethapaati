import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="w-12 h-[1px] bg-[#181513] animate-pulse mb-6"></div>
      <p className="font-serif text-xl tracking-tight text-[#181513]/70">
        Accessing Archive...
      </p>
    </div>
  );
}
