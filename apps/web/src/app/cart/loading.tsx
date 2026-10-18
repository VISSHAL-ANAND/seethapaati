export default function CartLoading() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:py-24" aria-label="Loading shopping cart">
      <div className="h-4 w-28 animate-pulse bg-[#ECE8E0]" />
      <div className="mt-3 h-10 w-48 animate-pulse bg-[#ECE8E0]" />

      <div className="mt-12 grid gap-12 lg:grid-cols-12">
        {/* Cart items list skeleton */}
        <div className="lg:col-span-7 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-[#ECE8E0] pb-6">
              <div className="h-24 w-20 flex-shrink-0 animate-pulse bg-[#ECE8E0]" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-3/4 animate-pulse bg-[#ECE8E0]" />
                <div className="h-4 w-1/4 animate-pulse bg-[#ECE8E0]" />
                <div className="h-8 w-24 animate-pulse bg-[#ECE8E0]" />
              </div>
            </div>
          ))}
        </div>

        {/* Order summary skeleton */}
        <div className="lg:col-span-5">
          <div className="border border-[#ECE8E0] p-6 space-y-5">
            <div className="h-5 w-32 animate-pulse bg-[#ECE8E0]" />
            <div className="space-y-3 pt-3 border-t border-[#ECE8E0]">
              <div className="flex justify-between">
                <div className="h-4 w-20 animate-pulse bg-[#ECE8E0]" />
                <div className="h-4 w-16 animate-pulse bg-[#ECE8E0]" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-20 animate-pulse bg-[#ECE8E0]" />
                <div className="h-4 w-16 animate-pulse bg-[#ECE8E0]" />
              </div>
            </div>
            <div className="h-12 w-full animate-pulse bg-[#ECE8E0] pt-2" />
          </div>
        </div>
      </div>
    </main>
  );
}
