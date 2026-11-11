"use client";

import { useState, type FormEvent } from "react";
import { DateField } from "@/components/ui/date-field";
import { toast } from "sonner";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useSavePatient } from "@/hooks/queries";
import { CARE_CONDITIONS, CONDITION_META, GENDERS, GENDER_LABEL } from "@/lib/constants";
import { patientSchema } from "@/lib/schemas";
import { toFieldErrors, zodErrors, type FieldErrors } from "@/lib/form";
import { daysBetween, fmtDate, stay, toDateInput } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Patient } from "@/lib/types";
import { DoctorPicker } from "./doctor-picker";

type Values = {
  name: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  condition: string;
  diagnosis: string;
  notes: string;
  admittedAt: string;
  doctor?: { id: string; name: string };
};

const fromPatient = (p?: Patient): Values => ({
  name: p?.name ?? "",
  age: p ? String(p.age) : "",
  gender: p?.gender ?? "",
  phone: p?.phone ?? "",
  email: p?.email ?? "",
  condition: p?.condition ?? "",
  diagnosis: p?.diagnosis ?? "",
  notes: p?.notes ?? "",
  admittedAt: toDateInput(p?.admittedAt ?? new Date()),
  doctor: p ? { id: p.doctor._id, name: p.doctor.name } : undefined,
});

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
  doctor,
  readOnly,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  patient?: Patient;
  readOnly?: boolean;
  /** When set, the patient is added under this doctor and the picker is hidden. */
  doctor?: { id: string; name: string };
}) {
  const title = readOnly ? "Patient Details" : patient ? "Edit Patient" : "Add Patient";
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={!patient && doctor ? `Under ${doctor.name}` : undefined}>
      {open && <PatientForm key={patient?._id ?? "new"} patient={patient} fixedDoctor={doctor} readOnly={readOnly} onDone={() => onOpenChange(false)} />}
    </Modal>
  );
}

function PatientForm({
  patient,
  fixedDoctor,
  readOnly,
  onDone,
}: {
  patient?: Patient;
  fixedDoctor?: { id: string; name: string };
  readOnly?: boolean;
  onDone: () => void;
}) {
  const [v, setV] = useState<Values>(() => ({ ...fromPatient(patient), ...(fixedDoctor && !patient ? { doctor: fixedDoctor } : {}) }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const save = useSavePatient();
  const today = toDateInput(new Date());
  // A released patient's condition is fixed until they are readmitted.
  const released = !!patient?.releasedAt;

  const put = <K extends keyof Values>(k: K, val: Values[K]) => {
    setV((x) => ({ ...x, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const bind = (k: Exclude<keyof Values, "doctor">) => ({
    value: v[k],
    onChange: (e: { target: { value: string } }) => put(k, e.target.value),
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = patientSchema.safeParse({
      ...v,
      condition: released ? "stable" : v.condition,
      doctor: fixedDoctor && !patient ? undefined : v.doctor?.id ?? "",
    });
    if (!parsed.success) return setErrors(zodErrors(parsed.error));
    const { admittedAt, condition, ...rest } = parsed.data;
    // A date-only value is stored at local noon so time zones cannot shift it to another day.
    const data = { ...rest, ...(released ? {} : { condition }), admittedAt: admittedAt === today ? new Date().toISOString() : new Date(`${admittedAt}T12:00:00`).toISOString() };
    try {
      await save.mutateAsync({ id: patient?._id, data, doctorId: !patient ? fixedDoctor?.id : undefined });
      toast.success(patient ? "Patient updated" : `${data.name} added`);
      onDone();
    } catch (err) {
      const fe = toFieldErrors(err);
      setErrors(fe);
      if (!Object.keys(fe).length) toast.error((err as Error).message);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      {patient?.releasedAt && (
        <p className="mb-4 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">
          Released {fmtDate(patient.releasedAt)}, stay {stay(daysBetween(patient.admittedAt, patient.releasedAt))}.
        </p>
      )}
      <fieldset disabled={readOnly} className="grid gap-4 pb-4 sm:grid-cols-6">
      <Field label="Full name" error={errors.name} className="sm:col-span-4">
        {(p) => <Input {...p} {...bind("name")} autoFocus autoComplete="off" />}
      </Field>
      <Field label="Age" error={errors.age} className="sm:col-span-2">
        {(p) => <Input {...p} {...bind("age")} type="number" inputMode="numeric" min={0} max={120} />}
      </Field>

      {!released && (
      <fieldset className="sm:col-span-6">
        <legend className="mb-1.5 text-sm font-medium">Condition</legend>
        <div role="radiogroup" className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {CARE_CONDITIONS.map((c) => {
            const on = v.condition === c;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => put("condition", c)}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-lg border px-2.5 text-sm",
                  on ? "border-ink bg-ink text-canvas" : "border-line hover:border-line-strong",
                )}
              >
                <span className="size-2 shrink-0 rounded-full" style={{ background: CONDITION_META[c].color }} />
                {CONDITION_META[c].label}
              </button>
            );
          })}
        </div>
        {errors.condition && <p className="mt-1.5 text-xs text-danger">{errors.condition}</p>}
      </fieldset>
      )}

      <Field label="Diagnosis" error={errors.diagnosis} className="sm:col-span-4">
        {(p) => <Input {...p} {...bind("diagnosis")} placeholder="Type 2 diabetes" />}
      </Field>
      <Field label="Admitted" error={errors.admittedAt} className="sm:col-span-2">
        {(p) => <DateField {...p} value={v.admittedAt} max={today} onChange={(d) => put("admittedAt", d)} />}
      </Field>

      {!(fixedDoctor && !patient) && (
        <Field label="Doctor" error={errors.doctor} className="sm:col-span-6">
          {(p) => <DoctorPicker id={p.id} invalid={!!errors.doctor} value={v.doctor} onChange={(d) => put("doctor", d)} />}
        </Field>
      )}

      <Field label="Gender" error={errors.gender} className="sm:col-span-2">
        {(p) => (
          <Select {...p} {...bind("gender")}>
            <option value="" disabled>
              Choose
            </option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {GENDER_LABEL[g]}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Phone" error={errors.phone} className="sm:col-span-2">
        {(p) => <Input {...p} {...bind("phone")} type="tel" autoComplete="off" />}
      </Field>
      <Field label="Email" error={errors.email} optional className="sm:col-span-2">
        {(p) => <Input {...p} {...bind("email")} type="email" autoComplete="off" />}
      </Field>
      <Field label="Notes" error={errors.notes} optional className="sm:col-span-6">
        {(p) => <Textarea {...p} {...bind("notes")} maxLength={1000} rows={2} />}
      </Field>

      </fieldset>
      <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 pb-4 sm:flex-row sm:justify-end">
        <Button type="button" onClick={onDone}>
          {readOnly ? "Close" : "Cancel"}
        </Button>
        {!readOnly && (
          <Button type="submit" variant="primary" loading={save.isPending}>
            {patient ? "Save Changes" : "Add Patient"}
          </Button>
        )}
      </div>
    </form>
  );
}
