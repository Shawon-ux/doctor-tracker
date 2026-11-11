"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useDeleteDoctor, useDoctors, useFacets } from "@/hooks/queries";
import { useUrlState } from "@/hooks/use-url-state";
import { useCanEdit } from "@/hooks/use-can";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ClearFilters, DateFilter, MultiFilter, SearchBox, SingleFilter } from "@/components/ui/filters";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { FetchBar } from "@/components/ui/fetch-bar";
import { useMinDelay } from "@/hooks/use-min-delay";
import { RowMenu } from "@/components/ui/menu";
import { ConfirmDialog } from "@/components/ui/confirm";
import { Avatar, SortHeader, td, th } from "@/components/ui/table";
import { SPECIALIZATIONS } from "@/lib/constants";
import { fmtDate, fmtNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { DoctorRow, Specialization } from "@/lib/types";
import dynamic from "next/dynamic";

const DoctorFormDialog = dynamic(() => import("./doctor-form").then((m) => m.DoctorFormDialog), { ssr: false });

const FILTER_KEYS = ["q", "specialization", "hospital", "from", "to"];

export function DoctorsView() {
  const router = useRouter();
  const url = useUrlState();
  const specs = (url.get("specialization")?.split(",").filter(Boolean) ?? []) as Specialization[];
  const sort = url.get("sort") ?? "-createdAt";
  const params = {
    q: url.get("q"),
    specialization: url.get("specialization"),
    hospital: url.get("hospital"),
    from: url.get("from"),
    to: url.get("to"),
    sort,
    page: Number(url.get("page") ?? 1),
    limit: Number(url.get("limit") ?? 10),
  };
  const { data, isPending, isError, refetch, isPlaceholderData } = useDoctors(params);
  const facets = useFacets();
  const remove = useDeleteDoctor();
  const canEdit = useCanEdit();
  const ready = useMinDelay();

  const [editing, setEditing] = useState<DoctorRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<DoctorRow | null>(null);
  const activeFilters = FILTER_KEYS.filter((k) => k !== "q" && url.get(k)).length - (url.get("from") && url.get("to") ? 1 : 0);

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting._id);
      toast.success(`${deleting.name} deleted`);
      setDeleting(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const menu = (d: DoctorRow) => [
    { label: "View Patients", icon: <Users size={15} />, onSelect: () => router.push(`/doctors/${d._id}`) },
    ...(canEdit
      ? [
          { label: "Edit", icon: <Pencil size={15} />, onSelect: () => setEditing(d) },
          { label: "Delete", icon: <Trash2 size={15} />, danger: true, onSelect: () => setDeleting(d) },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Doctors"
        actions={
          canEdit && (
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus size={16} /> Add Doctor
            </Button>
          )
        }
      >
        {data && ready ? (
          <p className="num mt-1 text-muted">{`${fmtNumber(data.total)} ${data.total === 1 ? "doctor" : "doctors"}`}</p>
        ) : (
          <Skeleton className="mt-2 h-4 w-24" />
        )}
      </PageHeader>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox value={url.get("q")} onChange={(q) => url.set({ q })} placeholder="Search name, hospital, specialty" />
        <MultiFilter label="Specialty" options={SPECIALIZATIONS} value={specs} onChange={(v) => url.set({ specialization: v.join(",") })} />
        <SingleFilter
          label="Hospital"
          options={(facets.data?.hospitals ?? []).map((h) => ({ value: h, label: h }))}
          value={url.get("hospital")}
          onChange={(hospital) => url.set({ hospital })}
        />
        <DateFilter label="Joined" from={url.get("from")} to={url.get("to")} onChange={(r) => url.set({ from: r.from, to: r.to })} />
        <ClearFilters count={activeFilters} onClear={() => url.clear(FILTER_KEYS)} />
      </div>

      <div className="relative overflow-hidden rounded-xl border border-line bg-surface">
        <FetchBar active={ready && isPlaceholderData} />
        {isError ? (
          <EmptyState title="Doctors Did Not Load" body="The API may be unreachable." action={<Button onClick={() => refetch()}>Try Again</Button>} />
        ) : isPending || !ready ? (
          <TableSkeleton rows={10} />
        ) : data.items.length === 0 ? (
          url.get("q") || activeFilters ? (
            <EmptyState title="No Doctors Match" body="Try a shorter search or remove a filter." action={<Button onClick={() => url.clear(FILTER_KEYS)}>Clear Search and Filters</Button>} />
          ) : (
            <EmptyState title="No Doctors Yet" body={canEdit ? "Add the first doctor to start assigning patients." : "Doctors will appear here once an admin adds them."} action={canEdit && <Button variant="primary" onClick={() => setCreating(true)}><Plus size={16} /> Add Doctor</Button>} />
          )
        ) : (
          <div className={cn("animate-[fade_200ms_ease-out] transition-opacity", isPlaceholderData && "opacity-60")} aria-busy={isPlaceholderData}>
            {/* Desktop table */}
            <table className="hidden w-full md:table">
              <thead className="border-b border-line bg-surface-2/60">
                <tr>
                  <SortHeader field="name" sort={sort} onSort={(s) => url.set({ sort: s })}>Doctor</SortHeader>
                  <SortHeader field="specialization" sort={sort} onSort={(s) => url.set({ sort: s })}>Specialty</SortHeader>
                  <SortHeader field="hospital" sort={sort} onSort={(s) => url.set({ sort: s })} className="hidden lg:table-cell">Hospital</SortHeader>
                  <th className={cn(th, "text-right")}>Patients</th>
                  <SortHeader field="createdAt" sort={sort} onSort={(s) => url.set({ sort: s })} className="hidden xl:table-cell">Joined</SortHeader>
                  <th className={th}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.items.map((d) => (
                  <tr key={d._id} className="group cursor-pointer hover:bg-surface-2/70" onClick={() => router.push(`/doctors/${d._id}`)}>
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Avatar name={d.name} />
                        <div className="min-w-0">
                          <Link href={`/doctors/${d._id}`} onClick={(e) => e.stopPropagation()} className="block truncate font-medium hover:underline">
                            {d.name}
                          </Link>
                          <p className="truncate text-sm text-muted">{d.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={td}>{d.specialization}</td>
                    <td className={cn(td, "hidden max-w-56 truncate text-muted lg:table-cell")}>{d.hospital}</td>
                    <td className={cn(td, "num text-right")}>
                      <span className="font-medium">{fmtNumber(d.patients.total)}</span>
                      {d.patients.critical > 0 && <span className="ml-2 text-sm text-danger">{d.patients.critical} critical</span>}
                    </td>
                    <td className={cn(td, "hidden text-muted xl:table-cell")}>{fmtDate(d.createdAt)}</td>
                    <td className={cn(td, "w-12 text-right")}>
                      <RowMenu label={`Actions for ${d.name}`} items={menu(d)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile list */}
            <ul className="divide-y divide-line md:hidden">
              {data.items.map((d) => (
                <li key={d._id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={d.name} />
                  <Link href={`/doctors/${d._id}`} className="min-w-0 flex-1">
                    <p className="truncate font-medium">{d.name}</p>
                    <p className="truncate text-sm text-muted">
                      {d.specialization}, <span className="num">{d.patients.total}</span> patients
                      {d.patients.critical > 0 && <span className="text-danger">, {d.patients.critical} critical</span>}
                    </p>
                  </Link>
                  <RowMenu label={`Actions for ${d.name}`} items={menu(d)} />
                </li>
              ))}
            </ul>

            <Pagination
              page={data.page}
              pages={data.pages}
              total={data.total}
              limit={data.limit}
              noun="doctors"
              onPage={(page) => url.set({ page })}
              onLimit={(limit) => url.set({ limit })}
            />
          </div>
        )}
      </div>

      {creating && <DoctorFormDialog open onOpenChange={setCreating} hospitals={facets.data?.hospitals} />}
      {editing && <DoctorFormDialog open onOpenChange={(o) => !o && setEditing(null)} doctor={editing} hospitals={facets.data?.hospitals} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "doctor"}?`}
        description={
          deleting?.patients.total
            ? `${deleting.name} has ${deleting.patients.total} patients. Reassign or remove them first, then delete.`
            : "This removes the doctor permanently."
        }
        confirmLabel={deleting?.patients.total ? "View Their Patients" : "Delete Doctor"}
        loading={remove.isPending}
        onConfirm={deleting?.patients.total ? () => router.push(`/doctors/${deleting._id}`) : confirmDelete}
      />
    </>
  );
}
