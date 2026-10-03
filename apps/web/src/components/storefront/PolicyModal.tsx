'use client';

import { useEffect, useState } from 'react';

type PolicyModalProps = {
  title: string;
  eyebrow?: string;
  description: string;
  children: React.ReactNode;
};

export function PolicyModal({ title, eyebrow = 'Legal', description, children }: PolicyModalProps) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-left text-[10px] uppercase tracking-[0.16em] text-[#A66B18] underline underline-offset-4 hover:text-[#181513]">
        Read {title}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#181513]/65 p-3 backdrop-blur-[3px] sm:p-6"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="policy-modal-title" className="relative flex max-h-[92svh] w-full max-w-3xl flex-col overflow-hidden bg-[#F7F5F0] shadow-[0_30px_100px_rgba(24,21,19,.28)]">
            <header className="shrink-0 border-b border-[#E3DFD7] px-6 py-6 sm:px-9 sm:py-7">
              <div className="flex items-start justify-between gap-6">
                <div className="max-w-xl">
                  <p className="eyebrow"><span className="eyebrow-dot" /> {eyebrow}</p>
                  <h1 id="policy-modal-title" className="mt-3 font-serif text-4xl font-normal leading-none tracking-[-0.05em] sm:text-5xl">{title}</h1>
                  <p className="mt-4 text-xs leading-6 text-[#181513]/60">{description}</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center border border-[#E3DFD7] text-lg leading-none transition-colors hover:border-[#B8860B] hover:text-[#A66B18]" aria-label={'Close ' + title}>×</button>
              </div>
            </header>
            <div className="min-h-0 overflow-y-auto px-6 py-7 sm:px-9 sm:py-9">
              <div className="space-y-8 text-sm leading-7 text-[#181513]/75">{children}</div>
            </div>
            <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-[#E3DFD7] px-6 py-4 sm:px-9">
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#181513]/40">Seethapaati</p>
              <button type="button" onClick={() => setOpen(false)} className="border border-[#181513] bg-[#181513] px-5 py-3 text-[9px] font-medium uppercase tracking-[0.16em] text-[#F7F5F0] transition-colors hover:bg-[#A66B18]">Close</button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
