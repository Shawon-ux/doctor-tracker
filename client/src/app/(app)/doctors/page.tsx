import type { Metadata } from "next";
import { Suspense } from "react";
import { DoctorsView } from "@/components/doctors/doctors-view";
import { ListPageSkeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Doctors" };

export default function DoctorsPage() {
  return (
    <Suspense fallback={<ListPageSkeleton pills={3} />}>
      <DoctorsView />
    </Suspense>
  );
}
