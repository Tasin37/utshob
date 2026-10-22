import AttendeePanel from "@/components/attendees/attendee-panel";
import { getUserOrganizations } from "@/lib/auth/session";

export const metadata = { title: "Attendees | Utshob" };

export default async function AttendeesPage() {
  const organizations = await getUserOrganizations();
  return <main className="dashboard-main"><div className="dashboard-topline"><div><p className="eyebrow"><span /> YOUR PEOPLE</p><h1>Attendees, <em>in view.</em></h1></div></div><AttendeePanel organizations={organizations.map((organization) => ({ id: organization.id, name: organization.name }))} /></main>;
}