import EventList from "@/components/events/event-list";
import { getUserOrganizations } from "@/lib/auth/session";

export const metadata = { title: "Your events | Utshob" };

export default async function EventsPage() {
  const organizations = await getUserOrganizations();

  return (
    <main className="dashboard-main">
      <div className="dashboard-topline">
        <div><p className="eyebrow"><span /> YOUR GATHERINGS</p><h1>Events, <em>in motion.</em></h1></div>
      </div>
      <EventList organizations={organizations.map((organization) => ({ id: organization.id, name: organization.name, role: organization.member?.role || "member" }))} />
    </main>
  );
}