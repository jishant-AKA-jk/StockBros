import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GridColumns } from '@/lib/types';
import { CardSkeleton } from '@/components/Skeletons';

export interface ChartGridProps<T = any> {
  items: T[];
  columns: GridColumns;
  onColumnsChange: (cols: GridColumns) => void;
  renderCard: (item: T, index: number) => ReactNode;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  total?: number;
  loadingSkeleton?: ReactNode;
}

export function ChartGrid<T>({
  items,
  columns,
  onColumnsChange,
  renderCard,
  loading = false,
  hasMore = false,
  onLoadMore,
  total,
  loadingSkeleton
}: ChartGridProps<T>) {
  
  const gridClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Top Bar with Grid Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-ink-light">
          {total !== undefined ? (
            <span>Showing {items.length} of {total} results</span>
          ) : (
            <span>{items.length} results</span>
          )}
        </div>
        <div className="flex items-center gap-1 bg-surface p-1 rounded-md border border-hairline">
          {([2, 3, 4, 5] as GridColumns[]).map((col) => (
            <button
              key={col}
              onClick={() => onColumnsChange(col)}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded text-xs font-medium transition-all",
                columns === col
                  ? "bg-paper text-ink shadow-sm border border-hairline"
                  : "text-ink-light hover:text-ink hover:bg-paper/50"
              )}
              title={`View ${col} per row`}
            >
              {col}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className={cn("grid gap-4", gridClasses[columns])}>
        {items.map((item, index) => (
          <div key={index} className="w-full">
            {renderCard(item, index)}
          </div>
        ))}
        {loading && (
          Array.from({ length: columns }).map((_, i) => (
            <div key={`skel-${i}`} className="w-full">
              {loadingSkeleton ? loadingSkeleton : (
                <CardSkeleton />
              )}
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button 
            variant="outline" 
            onClick={onLoadMore}
            disabled={loading}
            className="rounded-full px-8 bg-paper hover:bg-surface border-hairline transition-all active:scale-95"
          >
            {loading ? "Loading..." : `Load More (showing ${items.length} of ${total ?? 'many'})`}
          </Button>
        </div>
      )}
    </div>
  );
}
