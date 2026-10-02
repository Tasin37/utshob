"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function EventList({ organizations }) {
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || "");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(Boolean(organizationId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!organizationId) return undefined;
    let active = true;

    fetch(`/api/events?organizationId=${encodeURIComponent(organizationId)}`)
      .then(async (response) => {
        let result;
        try {
          result = await response.json();
        } catch {
          throw new Error(response.ok
            ? "The events service returned an invalid response."
            : `Could not load events (HTTP ${response.status}).`);
        }
        if (!response.ok) throw new Error(result.error?.message || "Could not load events.");
        if (!Array.isArray(result.events)) throw new Error("The events service returned an unexpected response.");
        if (active) setEvents(result.events);
      })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [organizationId]);

  if (!organizations.length) return null;

  return (
    <section className="event-list-section" aria-label="Organization events">
      <div className="event-list-toolbar">
        <label className="organization-select-label">
          Organization
          <select onChange={(event) => {
            setEvents([]);
            setError("");
            setLoading(true);
            setOrganizationId(event.target.value);
          }} value={organizationId}>
            {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
          </select>
        </label>
        <div className="event-list-actions">
          <Link className="quiet-link" href="/dashboard/organization/new">New organization <span aria-hidden="true">+</span></Link>
          <Link className="quiet-link" href="/dashboard/events/new">Create event <span aria-hidden="true">&#8599;</span></Link>
        </div>
      </div>

      {error && <p className="form-message form-error" role="alert">{error}</p>}
      {loading ? <p className="table-state">Loading events...</p> : events.length ? (
        <div className="event-list">
          {events.map((event) => (
            <Link className="event-list-row" href={event.status === "draft" ? `/dashboard/events/new?draftId=${encodeURIComponent(event.id)}` : `/e/${event.slug}`} key={event.id}>
              <span className="event-list-date">{event.starts_at ? new Date(event.starts_at).toLocaleDateString("en", { month: "short", day: "numeric" }) : "DRAFT"}</span>
              <span className="event-list-copy"><strong>{event.title}</strong><small>{event.venue_name || event.category}</small></span>
              <span className={`status-pill status-${event.status}`}>{event.status}</span>
              <span className="event-list-arrow" aria-hidden="true">&#8599;</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="dashboard-empty dashboard-empty-compact">
          <span className="empty-spark" aria-hidden="true">&#10033;</span>
          <h3>Your first event starts here.</h3>
          <p>Set the details, invite your people and make a date of it.</p>
          <Link className="button button-dark" href="/dashboard/events/new">Create your first event <span aria-hidden="true">&#8599;</span></Link>
        </div>
      )}
    </section>
  );
}