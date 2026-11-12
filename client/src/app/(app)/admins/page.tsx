import type { Metadata } from "next";
import { AdminsView } from "@/components/admins/admins-view";

export const metadata: Metadata = { title: "Add Admin" };

export default function AdminsPage() {
  return <AdminsView />;
}
