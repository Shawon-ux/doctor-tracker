"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, qs } from "@/lib/api";
import type {
  AdminInput,
  AdminUser,
  DoctorDetail,
  DoctorInput,
  DoctorRef,
  DoctorRow,
  Doctor,
  Overview,
  Paged,
  Patient,
  PatientInput,
  Range,
  User,
} from "@/lib/types";

type Params = Record<string, string | number | undefined>;

export const keys = {
  me: ["me"] as const,
  admins: ["admins"] as const,
  doctors: (p?: Params) => (p ? (["doctors", "list", p] as const) : (["doctors"] as const)),
  doctor: (id: string) => ["doctors", "detail", id] as const,
  doctorLookup: (q: string) => ["doctors", "lookup", q] as const,
  facets: ["doctors", "facets"] as const,
  patients: (p?: Params) => (p ? (["patients", "list", p] as const) : (["patients"] as const)),
  stats: (p: { range?: Range; from?: string; to?: string }) => ["stats", p] as const,
};

export const useMe = () =>
  useQuery({ queryKey: keys.me, queryFn: () => api<{ user: User }>("/auth/me").then((r) => r.user), staleTime: 5 * 60_000 });

export const useAdmins = (enabled = true) =>
  useQuery({ queryKey: keys.admins, queryFn: () => api<{ items: AdminUser[] }>("/admins").then((r) => r.items), enabled });

export function useAddAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminInput) => api<AdminUser>("/admins", { method: "POST", json: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.admins }),
  });
}

export function useDeleteAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/admins/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.admins }),
  });
}

export type OverviewParams = { range?: Range; from?: string; to?: string };

export const useOverview = (p: OverviewParams) =>
  useQuery({
    queryKey: keys.stats(p),
    queryFn: () => api<Overview>(`/stats/overview${qs(p)}`),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

export const useDoctors = (p: Params) =>
  useQuery({
    queryKey: keys.doctors(p),
    queryFn: () => api<Paged<DoctorRow>>(`/doctors${qs(p)}`),
    placeholderData: keepPreviousData,
  });

export const useDoctor = (id: string, enabled = true) =>
  useQuery({ queryKey: keys.doctor(id), queryFn: () => api<DoctorDetail>(`/doctors/${id}`), enabled });

export const useDoctorLookup = (q: string, enabled = true) =>
  useQuery({
    queryKey: keys.doctorLookup(q),
    queryFn: () => api<{ items: DoctorRef[] }>(`/doctors/lookup${qs({ q })}`).then((r) => r.items),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    enabled,
  });

export const useFacets = () =>
  useQuery({ queryKey: keys.facets, queryFn: () => api<{ hospitals: string[] }>("/doctors/facets"), staleTime: 5 * 60_000 });

export const usePatients = (p: Params, doctorId?: string) =>
  useQuery({
    queryKey: doctorId ? [...keys.doctor(doctorId), "patients", p] : keys.patients(p),
    queryFn: () => api<Paged<Patient>>(`${doctorId ? `/doctors/${doctorId}/patients` : "/patients"}${qs(p)}`),
    placeholderData: keepPreviousData,
  });

export const usePatient = (id: string | undefined, initialData?: Patient) =>
  useQuery({
    queryKey: ["patients", "detail", id],
    queryFn: () => api<Patient>(`/patients/${id}`),
    enabled: !!id,
    initialData,
  });

/** Any write can move dashboard numbers and list counts, so related caches are marked stale. */
function useInvalidate() {
  const qc = useQueryClient();
  return () => Promise.all([qc.invalidateQueries({ queryKey: ["doctors"] }), qc.invalidateQueries({ queryKey: ["patients"] }), qc.invalidateQueries({ queryKey: ["stats"] })]);
}

export function useSaveDoctor() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: Partial<DoctorInput> }) =>
      id ? api<Doctor>(`/doctors/${id}`, { method: "PATCH", json: data }) : api<Doctor>("/doctors", { method: "POST", json: data }),
    onSuccess: invalidate,
  });
}

/** Optional photo: a JPEG blob uploads it, null removes it. */
export function useDoctorPhoto() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, blob }: { id: string; blob: Blob | null }) => {
      if (blob) await api<{ photoAt: string }>(`/doctors/${id}/photo`, { method: "PUT", body: blob, headers: { "content-type": "image/jpeg" } });
      else await api<void>(`/doctors/${id}/photo`, { method: "DELETE" });
    },
    onSuccess: invalidate,
  });
}

export function useDeleteDoctor() {
  const qc = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/doctors/${id}`, { method: "DELETE" }),
    // Drop the deleted doctor's own queries first so they are not refetched into a 404.
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: keys.doctor(id) });
      return invalidate();
    },
  });
}

export function useSavePatient() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data, doctorId }: { id?: string; data: Partial<PatientInput>; doctorId?: string }) => {
      if (id) return api<Patient>(`/patients/${id}`, { method: "PATCH", json: data });
      if (doctorId) return api<Patient>(`/doctors/${doctorId}/patients`, { method: "POST", json: data });
      return api<Patient>("/patients", { method: "POST", json: data });
    },
    onSuccess: invalidate,
  });
}

/** Optimistic: the row leaves the table at once and comes back if the server refuses. */
export function useDeletePatient() {
  const qc = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, doctorId }: { id: string; doctorId?: string }) =>
      api<void>(doctorId ? `/doctors/${doctorId}/patients/${id}` : `/patients/${id}`, { method: "DELETE" }),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ["patients"] });
      await qc.cancelQueries({ queryKey: ["doctors"] });
      const snapshot = qc.getQueriesData<Paged<Patient>>({ predicate: (q) => isPatientPage(q.state.data) });
      for (const [key, data] of snapshot) {
        if (data) qc.setQueryData(key, { ...data, items: data.items.filter((p) => p._id !== id), total: data.total - 1 });
      }
      return { snapshot };
    },
    onError: (_e, _v, ctx) => ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: invalidate,
  });
}

const isPatientPage = (d: unknown): d is Paged<Patient> =>
  !!d && typeof d === "object" && "items" in d && Array.isArray(d.items) && (d.items.length === 0 || "diagnosis" in d.items[0]);

export function useRelease() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, releasedAt, readmit }: { id: string; releasedAt?: string; readmit?: boolean }) =>
      readmit
        ? api<Patient>(`/patients/${id}/readmit`, { method: "POST", json: {} })
        : api<Patient>(`/patients/${id}/release`, { method: "POST", json: { releasedAt } }),
    onSuccess: invalidate,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>("/auth/logout", { method: "POST" }),
    onSettled: () => {
      qc.clear();
      // Full reload on purpose: drops every cached query and in-memory state from the old session.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    },
  });
}
