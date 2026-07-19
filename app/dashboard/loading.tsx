import { ChartSkeleton, GridSkeleton } from "@/components/Skeletons";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-paper p-2 gap-2 animate-pulse">
      <div className="flex gap-2 h-[60%]">
        <div className="flex-[7]">
          <ChartSkeleton className="h-full w-full border-hairline rounded-xl" />
        </div>
        <div className="flex-[3]">
          <div className="h-full w-full bg-surface border-hairline rounded-xl border"></div>
        </div>
      </div>
      <div className="flex-1 mt-4 p-4 md:p-6">
        <div className="h-6 w-48 bg-surface rounded mb-4"></div>
        <GridSkeleton columns={4} rows={1} />
      </div>
    </div>
  );
}
