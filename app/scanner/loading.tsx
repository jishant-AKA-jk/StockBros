import { ChartSkeleton } from "@/components/Skeletons";

export default function ScannerLoading() {
  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] w-full overflow-hidden bg-paper">
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-hairline">
        {/* Header toolbar skeleton */}
        <div className="h-[73px] bg-surface border-b border-hairline flex items-center p-4 animate-pulse">
          <div className="h-8 w-32 bg-paper rounded mr-4" />
          <div className="h-8 w-48 bg-paper rounded" />
        </div>
        {/* Chart area */}
        <div className="flex-1 p-2">
          <ChartSkeleton className="h-full border-none" />
        </div>
      </div>
      
      {/* Sidebar */}
      <div className="w-full md:w-80 lg:w-96 bg-surface/50 p-6 animate-pulse">
        <div className="h-4 w-24 bg-paper rounded mb-6" />
        <div className="space-y-4 mb-8">
          <div className="h-6 w-full bg-paper rounded" />
          <div className="h-6 w-full bg-paper rounded" />
          <div className="h-6 w-full bg-paper rounded" />
        </div>
        
        <div className="h-4 w-32 bg-paper rounded mb-6" />
        <div className="space-y-4">
          <div className="h-12 w-full bg-paper rounded" />
          <div className="h-12 w-full bg-paper rounded" />
        </div>
      </div>
    </div>
  );
}
