'use client';

import React, { useEffect } from 'react';
import { Button } from '../components/ui/Button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled UI exception:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
      <span className="text-[11px] font-sans uppercase tracking-[0.25em] text-[#B8860B] mb-4 block">
        System Interruption
      </span>
      <h2 className="font-serif text-3xl md:text-4xl text-[#181513] mb-4">
        Unable to Load Archive
      </h2>
      <p className="text-[14px] text-[#181513]/70 font-sans leading-relaxed mb-8">
        We encountered a momentary disruption while attempting to render this scene. Please try refreshing.
      </p>
      <Button onClick={() => reset()} variant="solid">
        Re-attempt Connection
      </Button>
    </div>
  );
}
