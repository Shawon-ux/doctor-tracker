"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, Mail, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDeleteDoctor, useDoctor } from "@/hooks/queries";
import { useCanEdit } from "@/hooks/use-can";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { DoctorHeaderSkeleton, FilterBarSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { useMinDelay } from "@/hooks/use-min-delay";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm";
import { Avatar } from "@/components/ui/table";
import { PatientsPanel } from "@/components/patients/patients-panel";
import { CONDITIONS, CONDITION_META } from "@/lib/constants";
import { fmtDate, fmtNumber } from "@/lib/format";
import dynamic from "next/dynamic";

const DoctorFormDialog = dynamic(() => import("./doctor-form").then((m) => m.DoctorFormDialog), { ssr: false });
import { DoctorTrend } from "./doctor-trend";
import { InfoTip } from "@/components/ui/info-tip";

export function DoctorDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  // Set while deleting so cache invalidation does not refetch a record that no longer exists.
  const [gone, setGone] = useState(false);
  const { data: d, isPending, error } = useDoctor(id, !gone);
  const remove = useDeleteDoctor();
  const canEdit = useCanEdit();
  const ready = useMinDelay();
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (error) {
    const missing = error instanceof ApiError && (error.status === 404 || error.status === 400);
    return (
      <EmptyState
        title={missing ? "Doctor Not Found" : "Doctor Did Not Load"}
        body={missing ? "They may have been deleted." : "The API may be unreachable."}
        action={
          <Link href="/doctors" className="text-sm font-medium underline-offset-2 hover:underline">
            Back to doctors
          </Link>
        }
      />
    );
  }

  return (
    <>
      <Link href="/doctors" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ChevronLeft size={16} /> Doctors
      </Link>

      {isPending || !ready ? (
        <DoctorHeaderSkeleton />
      ) : (
        <section className="mb-6 animate-[fade_240ms_ease-out] rounded-xl border border-line bg-surface">
          <div className="flex flex-wrap items-start justify-between gap-4 p-5">
            <div className="flex min-w-0 items-center gap-4">
              <div className="scale-125">
                <Avatar name={d.name} />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold tracking-tight">{d.name}</h1>
                <p className="text-muted">
                  {d.specialization}, {d.hospital}
                </p>
              </div>
            </div>
            {canEdit && <div className="flex flex-wrap gap-2">
              <Button onClick={() => setEditing(true)}>
                <Pencil size={15} /> Edit
              </Button>
              <Button variant="ghost" onClick={() => setDeleting(true)} aria-label="Delete Doctor">
                <Trash2 size={15} />
              </Button>
              <Button variant="primary" onClick={() => setAdding(true)}>
                <Plus size={16} /> Add Patient
              </Button>
            </div>}
          </div>

          <dl className="grid border-t border-line sm:grid-cols-3">
            <div className="border-b border-line px-5 py-3 sm:border-r sm:border-b-0">
              <dt className="text-sm text-muted">Email</dt>
              <dd className="truncate">
                <a href={`mailto:${d.email}`} className="inline-flex max-w-full items-center gap-1.5 hover:underline">
                  <Mail size={14} className="shrink-0 text-faint" /> <span className="truncate">{d.email}</span>
                </a>
              </dd>
            </div>
            <div className="border-b border-line px-5 py-3 sm:border-r sm:border-b-0">
              <dt className="text-sm text-muted">Phone</dt>
              <dd>
                <a href={`tel:${d.phone.replace(/[^\d+]/g, "")}`} className="num inline-flex items-center gap-1.5 hover:underline">
                  <Phone size={14} className="text-faint" /> {d.phone}
                </a>
              </dd>
            </div>
            <div className="px-5 py-3">
              <dt className="text-sm text-muted">Joined</dt>
              <dd className="num">{fmtDate(d.createdAt)}</dd>
            </div>
          </dl>

          <div className="grid border-t border-line lg:grid-cols-2">
            <div className="border-b border-line px-5 py-4 lg:border-r lg:border-b-0">
              <p className="text-sm text-muted">
                <span className="num font-medium text-ink">{fmtNumber(d.patients.total)}</span> patients,{" "}
                <span className="num font-medium text-ink">{fmtNumber(d.patients.inCare)}</span> in care now
              </p>
              <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={CONDITIONS.map((c) => `${CONDITION_META[c].label} ${d.patients.byCondition[c] ?? 0}`).join(", ")}>
                {CONDITIONS.map((c) => {
                  const n = d.patients.byCondition[c] ?? 0;
                  return n ? <span key={c} title={`${CONDITION_META[c].label}: ${n}`} style={{ width: `${(n / d.patients.total) * 100}%`, background: CONDITION_META[c].color }} /> : null;
                })}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                {CONDITIONS.filter((c) => d.patients.byCondition[c]).map((c) => (
                  <li key={c} className="num inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: CONDITION_META[c].color }} />
                    {CONDITION_META[c].label} <span className="text-ink">{d.patients.byCondition[c]}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-5 py-4">
              <p className="flex items-center gap-1 text-sm text-muted">
                <span className="num font-medium text-ink">{fmtNumber(d.trend.reduce((n, m) => n + m.admissions, 0))}</span> admitted in the last 12 months
                <InfoTip label="About this chart">One bar per month by admission date. The lighter bar is the current month, still in progress.</InfoTip>
              </p>
              <DoctorTrend trend={d.trend} />
            </div>
          </div>
        </section>
      )}

      <h2 className="mb-3 text-md font-semibold">Patients</h2>
      {d && !gone ? (
        <PatientsPanel doctor={{ id: d._id, name: d.name }} createOpen={adding} onCreateOpen={setAdding} />
      ) : (
        <>
          <FilterBarSkeleton />
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <TableSkeleton rows={8} />
          </div>
        </>
      )}

      {d && editing && <DoctorFormDialog open onOpenChange={setEditing} doctor={d} />}
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete ${d?.name ?? "doctor"}?`}
        description={
          d?.patients.total
            ? `${d.name} still has ${d.patients.total} patients. Remove or reassign them below, then delete.`
            : "This removes the doctor permanently."
        }
        confirmLabel={d?.patients.total ? "Got It" : "Delete Doctor"}
        loading={remove.isPending}
        onConfirm={async () => {
          if (!d || d.patients.total) return setDeleting(false);
          setGone(true);
          try {
            await remove.mutateAsync(d._id);
            toast.success(`${d.name} deleted`);
            router.replace("/doctors");
          } catch (err) {
            setGone(false);
            toast.error((err as Error).message);
          }
        }}
      />
    </>
  );
}
