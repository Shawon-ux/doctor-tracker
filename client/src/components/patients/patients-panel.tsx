"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, LogOut, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDeletePatient, useRelease, usePatient, usePatients } from "@/hooks/queries";
import { ReleaseDialog } from "./release-dialog";
import { useCanEdit } from "@/hooks/use-can";
import { useUrlState } from "@/hooks/use-url-state";
import { Button } from "@/components/ui/button";
import { ClearFilters, DateFilter, MultiFilter, SearchBox, SingleFilter } from "@/components/ui/filters";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { FetchBar } from "@/components/ui/fetch-bar";
import { useMinDelay } from "@/hooks/use-min-delay";
import { RowMenu } from "@/components/ui/menu";
import { ConfirmDialog } from "@/components/ui/confirm";
import { ConditionBadge } from "@/components/ui/condition-badge";
import { Avatar, SortHeader, td, th } from "@/components/ui/table";
import { CONDITIONS, CONDITION_META, GENDERS, GENDER_LABEL, SPECIALIZATIONS } from "@/lib/constants";
import { daysBetween, fmtDate, fmtNumber, plural, stay } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Condition, Patient, Specialization } from "@/lib/types";
import { DoctorPicker } from "./doctor-picker";
import dynamic from "next/dynamic";

const PatientFormDialog = dynamic(() => import("./patient-form").then((m) => m.PatientFormDialog), { ssr: false });

const AGE_BANDS = [
  { value: "0-17", label: "Under 18" },
  { value: "18-39", label: "18 to 39" },
  { value: "40-64", label: "40 to 64" },
  { value: "65-120", label: "65 and Over" },
];

/**
 * The patient table with its filters. Used on the Patients page and, scoped to one
 * doctor, on that doctor's page.
 */
export function PatientsPanel({
  doctor,
  onCount,
  createOpen,
  onCreateOpen,
}: {
  doctor?: { id: string; name: string };
  onCount?: (n: number) => void;
  createOpen: boolean;
  onCreateOpen: (o: boolean) => void;
}) {
  const url = useUrlState();
  const conditions = (url.get("condition")?.split(",").filter(Boolean) ?? []) as Condition[];
  const specs = (url.get("specialization")?.split(",").filter(Boolean) ?? []) as Specialization[];
  const sort = url.get("sort") ?? "-admittedAt";
  const age = url.get("age");
  const [ageMin, ageMax] = age?.split("-") ?? [];
  const params = {
    q: url.get("q"),
    condition: url.get("condition"),
    gender: url.get("gender"),
    doctor: doctor ? undefined : url.get("doctor"),
    specialization: doctor ? undefined : url.get("specialization"),
    status: url.get("status"),
    ageMin,
    ageMax,
    from: url.get("from"),
    to: url.get("to"),
    sort,
    page: Number(url.get("page") ?? 1),
    limit: Number(url.get("limit") ?? 10),
  };
  const filterKeys = ["q", "status", "condition", "gender", "age", "from", "to", ...(doctor ? [] : ["doctor", "doctorName", "specialization"])];
  const active =
    ["status", "condition", "gender", "age", ...(doctor ? [] : ["doctor", "specialization"])].filter((k) => url.get(k)).length +
    (url.get("from") || url.get("to") ? 1 : 0);

  const { data, isPending, isError, refetch, isPlaceholderData } = usePatients(params, doctor?.id);
  const total = data?.total;
  useEffect(() => {
    if (total !== undefined) onCount?.(total);
  }, [total, onCount]);

  const remove = useDeletePatient();
  const canEdit = useCanEdit();
  const ready = useMinDelay();
  // The open patient lives in the URL (?patient=id), so Ctrl+K and shared links can open it directly.
  const openId = url.get("patient");
  const opened = usePatient(openId, data?.items.find((p) => p._id === openId));
  const keepPage = { page: url.get("page") };
  const setEditing = (p: Patient | null) => url.set({ patient: p?._id, ...keepPage });
  const [deleting, setDeleting] = useState<Patient | null>(null);
  const [releasing, setReleasing] = useState<Patient | null>(null);
  const readmit = useRelease();
  const doReadmit = (p: Patient) =>
    readmit.mutate(
      { id: p._id, readmit: true },
      { onSuccess: () => toast.success(`${p.name} readmitted`), onError: (e) => toast.error(e.message) },
    );

  const confirmDelete = () => {
    if (!deleting) return;
    const p = deleting;
    setDeleting(null);
    remove.mutate(
      { id: p._id, doctorId: doctor?.id },
      {
        onSuccess: () => toast.success(`${p.name} removed`),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const menu = (p: Patient) =>
    canEdit
      ? [
          { label: "Edit", icon: <Pencil size={15} />, onSelect: () => setEditing(p) },
          p.releasedAt
            ? { label: "Readmit", icon: <RotateCcw size={15} />, onSelect: () => doReadmit(p) }
            : { label: "Release", icon: <LogOut size={15} />, onSelect: () => setReleasing(p) },
          { label: doctor ? "Remove from List" : "Delete", icon: <Trash2 size={15} />, danger: true, onSelect: () => setDeleting(p) },
        ]
      : [{ label: "View Details", icon: <Eye size={15} />, onSelect: () => setEditing(p) }];
  const onSort = (s: string) => url.set({ sort: s });
  const doctorFilter = url.get("doctor") ? { id: url.get("doctor")!, name: url.get("doctorName") ?? "Selected doctor" } : undefined;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox value={url.get("q")} onChange={(q) => url.set({ q })} placeholder="Search name, diagnosis, phone" />
        <SingleFilter
          label="Status"
          options={[
            { value: "in_care", label: "In Care" },
            { value: "released", label: "Released" },
          ]}
          value={url.get("status")}
          onChange={(status) => url.set({ status })}
        />
        <MultiFilter
          label="Condition"
          options={CONDITIONS}
          value={conditions}
          onChange={(v) => url.set({ condition: v.join(",") })}
          render={(c) => (
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: CONDITION_META[c].color }} />
              {CONDITION_META[c].label}
            </span>
          )}
        />
        {!doctor && (
          <MultiFilter label="Specialty" options={SPECIALIZATIONS} value={specs} onChange={(v) => url.set({ specialization: v.join(",") })} />
        )}
        {!doctor && <DoctorPicker variant="filter" value={doctorFilter} onChange={(d) => url.set({ doctor: d?.id, doctorName: d?.name })} />}
        <SingleFilter label="Gender" options={GENDERS.map((g) => ({ value: g, label: GENDER_LABEL[g] }))} value={url.get("gender")} onChange={(gender) => url.set({ gender })} />
        <SingleFilter label="Age" options={AGE_BANDS} value={age} onChange={(a) => url.set({ age: a })} />
        <DateFilter label="Admitted" from={url.get("from")} to={url.get("to")} onChange={(r) => url.set({ from: r.from, to: r.to })} />
        <ClearFilters count={active} onClear={() => url.clear(filterKeys)} />
      </div>

      <div className="relative overflow-hidden rounded-xl border border-line bg-surface">
        <FetchBar active={ready && isPlaceholderData} />
        {isError ? (
          <EmptyState title="Patients Did Not Load" body="The API may be unreachable." action={<Button onClick={() => refetch()}>Try Again</Button>} />
        ) : isPending || !ready ? (
          <TableSkeleton rows={10} />
        ) : data.items.length === 0 ? (
          url.get("q") || active ? (
            <EmptyState title="No Patients Match" body="Try a shorter search or remove a filter." action={<Button onClick={() => url.clear(filterKeys)}>Clear Search and Filters</Button>} />
          ) : (
            <EmptyState
              title={doctor ? `${doctor.name} Has No Patients Yet` : "No Patients Yet"}
              body="Added patients appear here with their condition and doctor."
              action={
                canEdit && (
                  <Button variant="primary" onClick={() => onCreateOpen(true)}>
                    <Plus size={16} /> Add Patient
                  </Button>
                )
              }
            />
          )
        ) : (
          <div className={cn("animate-[fade_200ms_ease-out] transition-opacity", isPlaceholderData && "opacity-60")} aria-busy={isPlaceholderData}>
            <table className="hidden w-full md:table">
              <thead className="border-b border-line bg-surface-2/60">
                <tr>
                  <SortHeader field="name" sort={sort} onSort={onSort}>Patient</SortHeader>
                  <SortHeader field="condition" sort={sort} onSort={onSort}>Condition</SortHeader>
                  <th className={cn(th, "hidden xl:table-cell")}>Diagnosis</th>
                  {!doctor && <th className={th}>Doctor</th>}
                  <SortHeader field="admittedAt" sort={sort} onSort={onSort} className="hidden md:table-cell">Admitted</SortHeader>
                  <th className={th}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.items.map((p) => (
                  <tr key={p._id} className="hover:bg-surface-2/70">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Avatar name={p.name} tone="series" />
                        <div className="min-w-0">
                          <button onClick={() => setEditing(p)} className="block truncate text-left font-medium hover:underline">
                            {p.name}
                          </button>
                          <p className="num truncate text-sm text-muted">
                            {p.age} yrs, {GENDER_LABEL[p.gender].toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={td}>
                      <ConditionBadge condition={p.condition} />
                    </td>
                    <td className={cn(td, "hidden max-w-56 truncate xl:table-cell")}>{p.diagnosis}</td>
                    {!doctor && (
                      <td className={cn(td, "max-w-52")}>
                        <Link href={`/doctors/${p.doctor._id}`} className="block truncate hover:underline">
                          {p.doctor.name}
                        </Link>
                        <p className="truncate text-sm text-muted">{p.doctor.specialization}</p>
                      </td>
                    )}
                    <td className={cn(td, "num hidden md:table-cell")}>
                      <p className="text-muted">{fmtDate(p.admittedAt)}</p>
                      <StayNote p={p} />
                    </td>
                    <td className={cn(td, "w-12 text-right")}>
                      <RowMenu label={`Actions for ${p.name}`} items={menu(p)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-line md:hidden">
              {data.items.map((p) => (
                <li key={p._id} className="flex items-start gap-3 px-4 py-3">
                  <button onClick={() => setEditing(p)} className="min-w-0 flex-1 text-left">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{p.name}</span>
                      <ConditionBadge condition={p.condition} />
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted">
                      {p.diagnosis}
                      {!doctor && `, ${p.doctor.name}`}
                    </span>
                    <span className="num mt-0.5 block text-xs text-faint">
                      Admitted {fmtDate(p.admittedAt)}
                      {p.releasedAt ? `, released ${fmtDate(p.releasedAt)}` : `, in care ${plural(daysBetween(p.admittedAt), "day")}`}
                    </span>
                  </button>
                  <RowMenu label={`Actions for ${p.name}`} items={menu(p)} />
                </li>
              ))}
            </ul>

            <Pagination
              page={data.page}
              pages={data.pages}
              total={data.total}
              limit={data.limit}
              noun="patients"
              onPage={(page) => url.set({ page })}
              onLimit={(limit) => url.set({ limit })}
            />
          </div>
        )}
      </div>

      {createOpen && <PatientFormDialog open onOpenChange={onCreateOpen} doctor={doctor} />}
      {!!openId && !!opened.data && (
        <PatientFormDialog open onOpenChange={(o) => !o && setEditing(null)} patient={opened.data} readOnly={!canEdit} />
      )}
      {releasing && <ReleaseDialog patient={releasing} onClose={() => setReleasing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={doctor ? `Remove ${deleting?.name ?? "patient"}?` : `Delete ${deleting?.name ?? "patient"}?`}
        description="The patient record is deleted permanently. This cannot be undone."
        confirmLabel={doctor ? "Remove Patient" : "Delete Patient"}
        onConfirm={confirmDelete}
      />
    </>
  );
}

export const patientCount = (n?: number) => (n === undefined ? " " : `${fmtNumber(n)} ${n === 1 ? "patient" : "patients"}`);

function StayNote({ p }: { p: Patient }) {
  if (p.releasedAt) {
    return (
      <p className="text-sm text-faint">
        Released {fmtDate(p.releasedAt)}, {stay(daysBetween(p.admittedAt, p.releasedAt))}
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1.5 text-sm text-pine">
      <span aria-hidden className="size-1.5 rounded-full bg-pine" />
      In care, {plural(daysBetween(p.admittedAt), "day")}
    </p>
  );
}
