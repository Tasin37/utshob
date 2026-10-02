import Link from "next/link";
import { redirect } from "next/navigation";
import EventList from "@/components/events/event-list";
import { getServerSession, getUserOrganizations } from "@/lib/auth/session";

export const metadata = { title: "Organizer overview | Utshob" };

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  const organizations = await getUserOrganizations();

  if (!organizations.length) redirect("/dashboard/organization/new");

  return (
    <main className="dashboard-main">
      <div className="dashboard-topline">
        <div>
          <p className="eyebrow"><span /> YOUR ORGANIZER SPACE</p>
          <h1>Good morning, <em>{session.user.name?.split(" ")[0] || "there"}.</em></h1>
        </div>
        <Link className="button button-dark" href="/dashboard/events/new">Create event <span aria-hidden="true">&#8599;</span></Link>
      </div>

      <section className="workspace-picker" aria-label="Your organizations">
        <div>
          <span className="workspace-overline">YOUR ORGANIZATIONS</span>
          <h2>{organizations[0].name}</h2>
        </div>
        <span className="workspace-role">{organizations[0].member?.role || "member"}</span>
      </section>

      <div className="dashboard-section-heading">
        <div><span className="workspace-overline">THE LINEUP</span><h2>Your events</h2></div>
        <Link className="quiet-link" href="/dashboard/events">View all <span aria-hidden="true">&#8594;</span></Link>
      </div>
      <EventList organizations={organizations.map((organization) => ({ id: organization.id, name: organization.name, role: organization.member?.role || "member" }))} />
    </main>
  );
}