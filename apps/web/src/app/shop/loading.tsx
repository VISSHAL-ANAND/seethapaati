export default function ShopLoading() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="h-4 w-32 animate-pulse bg-[#ECE8E0]" />
        <div className="h-12 w-64 animate-pulse bg-[#ECE8E0]" />
        <div className="h-4 max-w-md animate-pulse bg-[#ECE8E0]" />
      </div>

      {/* Filter and search bar skeleton */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-y border-[#ECE8E0] py-4">
        <div className="h-10 w-full sm:w-72 animate-pulse bg-[#ECE8E0]" />
        <div className="flex gap-3">
          <div className="h-10 w-36 animate-pulse bg-[#ECE8E0]" />
          <div className="h-10 w-36 animate-pulse bg-[#ECE8E0]" />
        </div>
      </div>

      {/* Product Grid skeleton */}
      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="group flex flex-col space-y-4">
            <div className="aspect-[4/5] w-full animate-pulse bg-[#ECE8E0]" />
            <div className="space-y-2">
              <div className="h-3 w-20 animate-pulse bg-[#ECE8E0]" />
              <div className="h-5 w-4/5 animate-pulse bg-[#ECE8E0]" />
              <div className="h-4 w-1/3 animate-pulse bg-[#ECE8E0]" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
