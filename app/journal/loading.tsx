import { TableSkeleton } from "@/components/Skeletons";

export default function JournalLoading() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-8">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-8 animate-pulse">
        <div>
          <div className="h-8 w-48 bg-surface rounded mb-2" />
          <div className="h-4 w-64 bg-surface rounded" />
        </div>
        <div className="h-10 w-32 bg-primary/20 rounded-md" />
      </div>
      
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-xl p-4 border border-hairline">
            <div className="h-4 w-24 bg-paper rounded mb-2" />
            <div className="h-8 w-16 bg-paper rounded" />
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center mb-4 animate-pulse">
        <div className="h-6 w-32 bg-surface rounded" />
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-surface rounded" />
          <div className="h-8 w-8 bg-surface rounded" />
        </div>
      </div>
      
      <TableSkeleton rows={6} />
    </div>
  );
}
