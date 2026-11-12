import type { Metadata } from "next";
import { AdminsView } from "@/components/admins/admins-view";

export const metadata: Metadata = { title: "Admin Suite" };

export default function AdminsPage() {
  return <AdminsView />;
}
