"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { useSaveDoctor } from "@/hooks/queries";
import { SPECIALIZATIONS } from "@/lib/constants";
import { doctorSchema } from "@/lib/schemas";
import { toFieldErrors, zodErrors, type FieldErrors } from "@/lib/form";
import type { Doctor } from "@/lib/types";

const EMPTY = { name: "", specialization: "", hospital: "", phone: "", email: "" };

export function DoctorFormDialog({
  open,
  onOpenChange,
  doctor,
  hospitals = [],
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  doctor?: Doctor;
  hospitals?: string[];
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={doctor ? "Edit Doctor" : "Add Doctor"} description={doctor ? undefined : "They will appear in the doctor list right away."}>
      {/* Keyed so the form resets each time it opens. */}
      {open && <DoctorForm key={doctor?._id ?? "new"} doctor={doctor} hospitals={hospitals} onDone={() => onOpenChange(false)} />}
    </Modal>
  );
}

function DoctorForm({ doctor, hospitals, onDone }: { doctor?: Doctor; hospitals: string[]; onDone: () => void }) {
  const [values, setValues] = useState(doctor ? { ...EMPTY, ...doctor } : EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const save = useSaveDoctor();
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = doctorSchema.safeParse(values);
    if (!parsed.success) return setErrors(zodErrors(parsed.error));
    try {
      await save.mutateAsync({ id: doctor?._id, data: parsed.data });
      toast.success(doctor ? "Doctor updated" : `${parsed.data.name} added`);
      onDone();
    } catch (err) {
      const fe = toFieldErrors(err);
      setErrors(fe);
      if (!Object.keys(fe).length) toast.error((err as Error).message);
    }
  }

  return (
    <form id="doctor-form" onSubmit={submit} noValidate className="grid gap-4 pb-4 sm:grid-cols-2">
      <Field label="Full name" error={errors.name} className="sm:col-span-2">
        {(p) => <Input {...p} value={values.name} onChange={set("name")} placeholder="Dr. Amina Rahman" autoFocus />}
      </Field>
      <Field label="Specialty" error={errors.specialization}>
        {(p) => (
          <Select {...p} value={values.specialization} onChange={set("specialization")}>
            <option value="" disabled>
              Choose a specialty
            </option>
            {SPECIALIZATIONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Hospital" error={errors.hospital}>
        {(p) => (
          <>
            <Input {...p} value={values.hospital} onChange={set("hospital")} list="hospital-options" placeholder="Riverside General Hospital" />
            <datalist id="hospital-options">
              {hospitals.map((h) => (
                <option key={h} value={h} />
              ))}
            </datalist>
          </>
        )}
      </Field>
      <Field label="Phone" error={errors.phone}>
        {(p) => <Input {...p} type="tel" value={values.phone} onChange={set("phone")} placeholder="+880 1711 000000" autoComplete="off" />}
      </Field>
      <Field label="Email" error={errors.email}>
        {(p) => <Input {...p} type="email" value={values.email} onChange={set("email")} placeholder="name@hospital.org" autoComplete="off" />}
      </Field>
      <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:col-span-2 sm:flex-row sm:justify-end">
        <Button type="button" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={save.isPending}>
          {doctor ? "Save Changes" : "Add Doctor"}
        </Button>
      </div>
    </form>
  );
}
