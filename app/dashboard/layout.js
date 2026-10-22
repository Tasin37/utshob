import Link from "next/link";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/dashboard/sign-out-button";
import { getServerSession } from "@/lib/auth/session";

const navigation = [
  { label: "Overview", href: "/dashboard" },
  { label: "Events", href: "/dashboard/events" },
  { label: "Attendees", href: "/dashboard/attendees" },
  { label: "Check-in", href: "/dashboard/check-in" },
  { label: "Analytics", href: "/dashboard/analytics" },
  { label: "Team", href: "/dashboard/team" },
];

export default async function DashboardLayout({ children }) {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link className="brand" href="/" aria-label="Utshob home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>utshob</span>
        </Link>
        <p className="sidebar-label">WORKSPACE</p>
        <nav aria-label="Organizer navigation" className="dashboard-nav">
          {navigation.map((item) => (
            <Link className="dashboard-nav-link" href={item.href} key={item.href}>
              <span className="dashboard-nav-mark" aria-hidden="true" />{item.label}
            </Link>
          ))}
        </nav>
        <Link className="dashboard-create-link" href="/dashboard/events/new">
          <span aria-hidden="true">+</span> Create event
        </Link>
        <div className="sidebar-bottom">
          <span className="sidebar-avatar" aria-hidden="true">{session.user.name?.slice(0, 1).toUpperCase() || "U"}</span>
          <span className="sidebar-user">{session.user.name || session.user.email}</span>
          <SignOutButton />
        </div>
      </aside>
      <div className="dashboard-content">{children}</div>
    </div>
  );
}