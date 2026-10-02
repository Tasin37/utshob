import EventWizard from "@/components/events/event-wizard";
import { getUserOrganizations } from "@/lib/auth/session";

export const metadata = { title: "Create an event | Utshob" };

export default async function NewEventPage({ searchParams }) {
  const [{ draftId = "" }, organizations] = await Promise.all([
    searchParams,
    getUserOrganizations(),
  ]);

  return (
    <main className="dashboard-main event-wizard-main">
      <EventWizard
        draftId={draftId}
        organizations={organizations.map((organization) => ({ id: organization.id, name: organization.name, role: organization.member?.role || "member" }))}
      />
    </main>
  );
}