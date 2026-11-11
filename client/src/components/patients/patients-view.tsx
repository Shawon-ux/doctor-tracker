"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useCanEdit } from "@/hooks/use-can";
import { PatientsPanel, patientCount } from "./patients-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useMinDelay } from "@/hooks/use-min-delay";

export function PatientsView() {
  const [creating, setCreating] = useState(false);
  const [count, setCount] = useState<number>();
  const canEdit = useCanEdit();
  const ready = useMinDelay();
  return (
    <>
      <PageHeader
        title="Patients"
        actions={
          canEdit && (
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus size={16} /> Add Patient
            </Button>
          )
        }
      >
        {count !== undefined && ready ? <p className="num mt-1 text-muted">{patientCount(count)}</p> : <Skeleton className="mt-2 h-4 w-24" />}
      </PageHeader>
      <PatientsPanel createOpen={creating} onCreateOpen={setCreating} onCount={setCount} />
    </>
  );
}
