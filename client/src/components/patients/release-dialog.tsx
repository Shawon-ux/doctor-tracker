"use client";

import { useState } from "react";
import { DateField } from "@/components/ui/date-field";
import { toast } from "sonner";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useRelease } from "@/hooks/queries";
import { toFieldErrors } from "@/lib/form";
import { fmtDate, toDateInput } from "@/lib/format";
import type { Patient } from "@/lib/types";

export function ReleaseDialog({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const today = toDateInput(new Date());
  const [date, setDate] = useState(today);
  const [error, setError] = useState<string>();
  const release = useRelease();

  const submit = async () => {
    try {
      if (!date) return setError("Enter a date as DD-MM-YYYY");
      // Today means now; an earlier day is stored at local noon so time zones keep the date.
      const releasedAt = date === today ? new Date().toISOString() : new Date(`${date}T12:00:00`).toISOString();
      await release.mutateAsync({ id: patient._id, releasedAt });
      toast.success(`${patient.name} released`);
      onClose();
    } catch (err) {
      setError(toFieldErrors(err).releasedAt ?? (err as Error).message);
    }
  };

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      size="sm"
      title={`Release ${patient.name}?`}
      description={`Admitted ${fmtDate(patient.admittedAt)}. Their condition becomes Released.`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={release.isPending}>
            Release Patient
          </Button>
        </>
      }
    >
      <Field label="Release date" error={error} className="pb-3">
        {(p) => (
          <DateField
            {...p}
            value={date}
            min={toDateInput(patient.admittedAt)}
            max={today}
            onChange={(v) => {
              setDate(v);
              setError(undefined);
            }}
          />
        )}
      </Field>
    </Modal>
  );
}
