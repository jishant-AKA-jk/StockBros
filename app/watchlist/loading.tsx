import { GridSkeleton } from "@/components/Skeletons";

export default function WatchlistLoading() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-8">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-pulse">
        <div>
          <div className="h-8 w-48 bg-surface rounded mb-2" />
          <div className="h-4 w-64 bg-surface rounded" />
        </div>
        <div className="h-10 w-32 bg-surface rounded-md" />
      </div>
      
      {/* Tabs Skeleton */}
      <div className="mb-6 h-10 w-[300px] bg-surface rounded-md animate-pulse" />
      
      {/* Grid Controls Skeleton */}
      <div className="flex justify-between items-center mb-4 animate-pulse">
        <div className="h-4 w-32 bg-surface rounded" />
        <div className="h-8 w-32 bg-surface rounded" />
      </div>
      
      <GridSkeleton columns={3} rows={2} />
    </div>
  );
}
