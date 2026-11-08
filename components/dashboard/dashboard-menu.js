"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SignOutButton from "@/components/dashboard/sign-out-button";

const navigation = [
  { label: "Overview", href: "/dashboard" },
  { label: "Events", href: "/dashboard/events" },
  { label: "Attendees", href: "/dashboard/attendees" },
  { label: "Check-in", href: "/dashboard/check-in" },
  { label: "Analytics", href: "/dashboard/analytics" },
  { label: "Team", href: "/dashboard/team" },
];

export default function DashboardMenu({ session }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <>
      <button
        aria-controls="dashboard-navigation"
        aria-expanded={open}
        aria-label={open ? "Close dashboard menu" : "Open dashboard menu"}
        className={`dashboard-menu-toggle${open ? " is-open" : ""}`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span />
        <span />
        <span />
      </button>
      <button
        aria-label="Close dashboard menu"
        className={`dashboard-menu-backdrop${open ? " is-visible" : ""}`}
        onClick={closeMenu}
        tabIndex={open ? 0 : -1}
        type="button"
      />
      <aside className={`dashboard-sidebar${open ? " is-open" : ""}`} id="dashboard-navigation">
        <div className="dashboard-sidebar-top">
          <Link className="brand" href="/" onClick={closeMenu} aria-label="Utshob home">
            <span className="brand-mark" aria-hidden="true"><span /></span>
            <span>utshob</span>
          </Link>
        </div>
        <p className="sidebar-label">WORKSPACE</p>
        <nav aria-label="Organizer navigation" className="dashboard-nav">
          {navigation.map((item) => (
            <Link className="dashboard-nav-link" href={item.href} key={item.href} onClick={closeMenu}>
              <span className="dashboard-nav-mark" aria-hidden="true" />{item.label}
            </Link>
          ))}
        </nav>
        <Link className="dashboard-create-link" href="/dashboard/events/new" onClick={closeMenu}>
          <span aria-hidden="true">+</span><span className="dashboard-create-label">Add Events</span>
        </Link>
        <div className="sidebar-bottom">
          <span className="sidebar-avatar" aria-hidden="true">{session.user.name?.slice(0, 1).toUpperCase() || "U"}</span>
          <span className="sidebar-user">{session.user.name || session.user.email}</span>
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}
