import type { Metadata } from "next";
import { Suspense } from "react";
import { DoctorDetail } from "@/components/doctors/doctor-detail";
import { DoctorPageSkeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Doctor" };

export default function DoctorPage() {
  return (
    <Suspense fallback={<DoctorPageSkeleton />}>
      <DoctorDetail />
    </Suspense>
  );
}
