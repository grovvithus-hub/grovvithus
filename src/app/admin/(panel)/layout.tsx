import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { DialogProvider } from "@/components/ui/DialogProvider";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Admin | GrovvIthUs", robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return (
    <DialogProvider>
      <AdminShell user={{ name: user.name, email: user.email, role: user.role }}>{children}</AdminShell>
    </DialogProvider>
  );
}
