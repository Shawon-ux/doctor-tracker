import { Suspense } from "react";
import { DashboardPageSkeleton, DashboardView } from "@/components/dashboard/dashboard-view";

export default function OverviewPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <DashboardView />
    </Suspense>
  );
}
