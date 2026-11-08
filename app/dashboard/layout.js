import { redirect } from "next/navigation";
import DashboardMenu from "@/components/dashboard/dashboard-menu";
import { getServerSession } from "@/lib/auth/session";

export default async function DashboardLayout({ children }) {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  return (
    <div className="dashboard-layout">
      <DashboardMenu session={session} />
      <div className="dashboard-content">{children}</div>
    </div>
  );
}