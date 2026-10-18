export default function ProductLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16 md:py-24" aria-label="Loading product details">
      <div className="grid gap-12 md:grid-cols-2 md:gap-16">
        {/* Image Gallery Skeleton */}
        <div className="space-y-4">
          <div className="aspect-[4/5] w-full animate-pulse bg-[#ECE8E0]" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 w-16 animate-pulse bg-[#ECE8E0]" />
            ))}
          </div>
        </div>

        {/* Product Details Skeleton */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="h-4 w-28 animate-pulse bg-[#ECE8E0]" />
          <div className="h-10 w-4/5 animate-pulse bg-[#ECE8E0]" />
          <div className="h-6 w-32 animate-pulse bg-[#ECE8E0]" />
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full animate-pulse bg-[#ECE8E0]" />
            <div className="h-4 w-5/6 animate-pulse bg-[#ECE8E0]" />
            <div className="h-4 w-3/4 animate-pulse bg-[#ECE8E0]" />
          </div>

          <div className="pt-4 space-y-3">
            <div className="h-4 w-24 animate-pulse bg-[#ECE8E0]" />
            <div className="flex gap-3">
              <div className="h-11 w-28 animate-pulse bg-[#ECE8E0]" />
              <div className="h-11 w-28 animate-pulse bg-[#ECE8E0]" />
            </div>
          </div>

          <div className="pt-6">
            <div className="h-14 w-full animate-pulse bg-[#ECE8E0]" />
          </div>
        </div>
      </div>
    </main>
  );
}
