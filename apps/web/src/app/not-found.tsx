import React from 'react';
import Link from 'next/link';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
      <span className="text-[11px] font-sans uppercase tracking-[0.25em] text-[#181513]/50 mb-4 block">
        Document 404
      </span>
      <h2 className="font-serif text-4xl md:text-5xl text-[#181513] mb-4">
        Page Not Found
      </h2>
      <p className="text-[14px] text-[#181513]/70 font-sans leading-relaxed mb-8">
        The botanical archive or harvest page you requested does not exist or has been archived.
      </p>
      <Link href="/">
        <Button variant="solid">
          Return to Atelier &rarr;
        </Button>
      </Link>
    </div>
  );
}
