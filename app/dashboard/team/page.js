import TeamManager from "@/components/organizations/team-manager";
import { getUserInvitations, getUserOrganizations } from "@/lib/auth/session";

export const metadata = { title: "Organization team | Utshob" };

export default async function TeamPage() {
  const [organizations, incomingInvitations] = await Promise.all([
    getUserOrganizations(),
    getUserInvitations(),
  ]);

  return (
    <main className="dashboard-main">
      <div className="dashboard-topline">
        <div>
          <p className="eyebrow"><span /> THE PEOPLE BEHIND IT</p>
          <h1>Your <em>team.</em></h1>
        </div>
      </div>
      <TeamManager incomingInvitations={incomingInvitations || []} organizations={organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
        role: organization.member?.role || "member",
      }))} />
    </main>
  );
}