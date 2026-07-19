import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Mimics a main chart area (like the one on Dashboard or Scanner)
 */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col space-y-4 w-full h-[500px] p-4 bg-surface rounded-xl border border-hairline", className)}>
      {/* Top bar (stock name, controls) */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-8 w-[150px]" />
      </div>
      {/* Chart main area */}
      <Skeleton className="flex-1 w-full rounded-md" />
    </div>
  );
}

/**
 * Mimics a stock card with a mini chart inside (used in Screener, Watchlist, etc.)
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col p-4 bg-surface rounded-xl border border-hairline h-[250px]", className)}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <Skeleton className="h-5 w-[100px] mb-2" />
          <Skeleton className="h-3 w-[60px]" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="flex-1 w-full rounded-md" />
    </div>
  );
}

/**
 * Grid of card skeletons for list views like Screener or Watchlist
 */
export function GridSkeleton({ columns = 2, rows = 2, className }: { columns?: number, rows?: number, className?: string }) {
  // CSS Grid configuration matching ChartGrid's responsive design, but forced up to `columns`
  const gridClasses: Record<number, string> = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
  };

  const total = columns * rows;

  return (
    <div className={cn("grid gap-4 w-full", gridClasses[columns] || gridClasses[2], className)}>
      {Array.from({ length: total }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Table skeleton for Ledger or History lists
 */
export function TableSkeleton({ rows = 5, className }: { rows?: number, className?: string }) {
  return (
    <div className={cn("w-full border border-hairline rounded-xl overflow-hidden bg-surface", className)}>
      {/* Header */}
      <div className="flex p-4 border-b border-hairline bg-paper/50 gap-4">
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-[50px]" />
      </div>
      {/* Body */}
      <div className="flex flex-col">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex p-4 border-b border-hairline last:border-0 gap-4 items-center">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-8 w-[50px] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
