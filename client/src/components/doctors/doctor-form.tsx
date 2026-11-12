"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { useDoctorPhoto, useSaveDoctor } from "@/hooks/queries";
import { Avatar } from "@/components/ui/table";
import { MAX_PHOTO_INPUT, doctorPhotoUrl, resizeToJpeg } from "@/lib/photo";
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
  const savePhoto = useDoctorPhoto();
  // undefined = leave as is, Blob = new photo, null = remove the current one.
  const [photo, setPhoto] = useState<Blob | null | undefined>(undefined);
  const preview = useMemo(() => (photo instanceof Blob ? URL.createObjectURL(photo) : undefined), [photo]);
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);
  const fileRef = useRef<HTMLInputElement>(null);
  const shown = photo === null ? undefined : (preview ?? (doctor ? doctorPhotoUrl(doctor) : undefined));

  async function pick(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file (JPG or PNG)");
    if (file.size > MAX_PHOTO_INPUT) return toast.error("That image is over 10 MB");
    try {
      setPhoto(await resizeToJpeg(file));
    } catch {
      toast.error("Could not read that image. Try a JPG or PNG");
    }
  }

  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = doctorSchema.safeParse(values);
    if (!parsed.success) return setErrors(zodErrors(parsed.error));
    try {
      const saved = await save.mutateAsync({ id: doctor?._id, data: parsed.data });
      let photoFailed = false;
      if (photo !== undefined) {
        try {
          await savePhoto.mutateAsync({ id: saved._id, blob: photo });
        } catch {
          photoFailed = true;
        }
      }
      if (photoFailed) toast.warning("Doctor saved, but the photo could not be uploaded. Try again from Edit");
      else toast.success(doctor ? "Doctor updated" : `${parsed.data.name} added`);
      onDone();
    } catch (err) {
      const fe = toFieldErrors(err);
      setErrors(fe);
      if (!Object.keys(fe).length) toast.error((err as Error).message);
    }
  }

  return (
    <form id="doctor-form" onSubmit={submit} noValidate className="grid gap-4 pb-4 sm:grid-cols-2">
      <div className="flex items-center gap-4 sm:col-span-2">
        <Avatar name={values.name || "Dr"} src={shown} size="lg" />
        <div className="min-w-0">
          <p className="text-sm font-medium">
            Photo <span className="font-normal text-muted">(optional)</span>
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => fileRef.current?.click()}>
              <Camera size={14} /> {shown ? "Change" : "Add Photo"}
            </Button>
            {shown && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setPhoto(doctor?.photoAt ? null : undefined)}>
                Remove
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              void pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </div>
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
        <Button type="submit" variant="primary" loading={save.isPending || savePhoto.isPending}>
          {doctor ? "Save Changes" : "Add Doctor"}
        </Button>
      </div>
    </form>
  );
}
