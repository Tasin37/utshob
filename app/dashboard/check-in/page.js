import CheckinPanel from "@/components/checkin/checkin-panel";
import { getUserOrganizations } from "@/lib/auth/session";

export const metadata = { title: "Check-in | Utshob" };

export default async function CheckinPage() {
  const organizations = await getUserOrganizations();
  return (
    <main className="dashboard-main">
      <div className="dashboard-topline"><div><p className="eyebrow"><span /> WELCOME THEM IN</p><h1>Check-in, <em>made easy.</em></h1></div></div>
      <CheckinPanel organizations={organizations.map((organization) => ({ id: organization.id, name: organization.name }))} />
    </main>
  );
}