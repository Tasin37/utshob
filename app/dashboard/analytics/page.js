import AnalyticsPanel from "@/components/analytics/analytics-panel";
import { getUserOrganizations } from "@/lib/auth/session";

export const metadata = { title: "Analytics | Utshob" };

export default async function AnalyticsPage() {
  const organizations = await getUserOrganizations();
  return <main className="dashboard-main"><div className="dashboard-topline"><div><p className="eyebrow"><span /> KNOW YOUR CROWD</p><h1>Numbers, <em>with a pulse.</em></h1></div></div><AnalyticsPanel organizations={organizations.map((organization) => ({ id: organization.id, name: organization.name }))} /></main>;
}