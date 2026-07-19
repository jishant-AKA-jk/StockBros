import { GridSkeleton } from "@/components/Skeletons";

export default function ScreenerLoading() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-8">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="h-8 w-48 bg-surface rounded mb-2 animate-pulse" />
          <div className="h-4 w-64 bg-surface rounded animate-pulse" />
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar Skeleton */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="bg-surface rounded-xl p-5 border border-hairline min-h-[300px] animate-pulse" />
        </div>
        
        {/* Main Grid Skeleton */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4 animate-pulse">
            <div className="h-4 w-32 bg-surface rounded" />
            <div className="h-8 w-32 bg-surface rounded" />
          </div>
          <GridSkeleton columns={3} rows={2} />
        </div>
      </div>
    </div>
  );
}
