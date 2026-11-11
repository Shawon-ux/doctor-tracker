import type { Metadata } from "next";
import { Suspense } from "react";
import { PatientsView } from "@/components/patients/patients-view";
import { ListPageSkeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Patients" };

export default function PatientsPage() {
  return (
    <Suspense fallback={<ListPageSkeleton pills={6} />}>
      <PatientsView />
    </Suspense>
  );
}
