"use client";

import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/app-shell";
import { Button, IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm";
import { Modal } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { Avatar } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddAdmin, useAdmins, useDeleteAdmin, useMe } from "@/hooks/queries";
import { useCanEdit } from "@/hooks/use-can";
import { fmtDate, fmtRelative } from "@/lib/format";
import { adminSchema } from "@/lib/schemas";
import { toFieldErrors, zodErrors, type FieldErrors } from "@/lib/form";
import type { AdminUser } from "@/lib/types";

export function AdminsView() {
  const isAdmin = useCanEdit();
  const { data: me } = useMe();
  const { data, isPending, isError, refetch } = useAdmins(isAdmin);
  const remove = useDeleteAdmin();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  if (me && !isAdmin) {
    return <EmptyState title="Admins only" body="Your account is view-only, so it cannot manage admins." />;
  }

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success(`${deleting.name} removed`);
    } catch (err) {
      toast.error((err as Error).message);
    }
    setDeleting(null);
  };

  return (
    <>
      <PageHeader
        title="Add Admin"
        actions={
          <Button variant="primary" onClick={() => setAdding(true)}>
            <Plus size={16} /> Add Admin
          </Button>
        }
      >
        <p className="mt-1 text-sm text-muted">Every admin can add or remove other admins.</p>
      </PageHeader>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        {isPending ? (
          <div className="grid gap-3 p-5">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : isError ? (
          <EmptyState title="Could not load admins" action={<Button onClick={() => refetch()}>Try Again</Button>} />
        ) : (
          <ul className="divide-y divide-line">
            {data.map((a) => {
              const self = a.id === me?.id;
              return (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={a.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium">
                      {a.name}
                      {self && <span className="ml-2 rounded bg-pine-soft px-1.5 py-0.5 text-xs font-normal text-muted">You</span>}
                    </p>
                    <p className="truncate text-sm text-muted">{a.email}</p>
                  </div>
                  <p className="hidden text-sm text-muted sm:block">
                    {a.lastLoginAt ? `Last sign-in ${fmtRelative(a.lastLoginAt)}` : `Added ${fmtDate(a.createdAt)}`}
                  </p>
                  {!self && (
                    <IconButton label={`Remove ${a.name}`} onClick={() => setDeleting(a)} className="hover:text-danger">
                      <Trash2 size={16} />
                    </IconButton>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal open={adding} onOpenChange={setAdding} title="Add Admin" description="They can sign in right away with this email and password.">
        {adding && <AdminForm onDone={() => setAdding(false)} />}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Remove ${deleting?.name ?? "admin"}?`}
        description="They will be signed out and lose access immediately. This cannot be undone."
        confirmLabel="Remove Admin"
        onConfirm={confirmDelete}
        loading={remove.isPending}
      />
    </>
  );
}

function AdminForm({ onDone }: { onDone: () => void }) {
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const add = useAddAdmin();
  const set = (k: keyof typeof values) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = adminSchema.safeParse(values);
    if (!parsed.success) return setErrors(zodErrors(parsed.error));
    try {
      await add.mutateAsync(parsed.data);
      toast.success(`${parsed.data.name} added as admin`);
      onDone();
    } catch (err) {
      const fe = toFieldErrors(err);
      setErrors(fe);
      if (!Object.keys(fe).length) toast.error((err as Error).message);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 pb-4">
      <Field label="Full name" error={errors.name}>
        {(p) => <Input {...p} value={values.name} onChange={set("name")} autoFocus autoComplete="off" />}
      </Field>
      <Field label="Email" error={errors.email}>
        {(p) => <Input {...p} type="email" value={values.email} onChange={set("email")} autoComplete="off" />}
      </Field>
      <Field label="Password" error={errors.password} hint="At least 10 characters. Share it with them securely.">
        {(p) => <Input {...p} type="password" value={values.password} onChange={set("password")} autoComplete="new-password" />}
      </Field>
      <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
        <Button type="button" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={add.isPending}>
          Add Admin
        </Button>
      </div>
    </form>
  );
}
