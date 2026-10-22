"use client";

import { useEffect, useState } from "react";

export default function AttendeePanel({ organizations }) {
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || "");
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(Boolean(organizationId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!organizationId) return undefined;
    let active = true;
    fetch(`/api/events?organizationId=${encodeURIComponent(organizationId)}`)
      .then((response) => response.json().then((body) => ({ response, body })))
      .then(({ response, body }) => {
        if (!response.ok) throw new Error(body.error?.message || "Could not load events.");
        if (active) {
          const published = body.events.filter((event) => event.status === "published");
          setEvents(published);
          setEventId((current) => published.some((event) => event.id === current) ? current : published[0]?.id || "");
        }
      })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId || !eventId) return undefined;
    let active = true;
    fetch(`/api/events/${encodeURIComponent(eventId)}/attendees?organizationId=${encodeURIComponent(organizationId)}`)
      .then((response) => response.json().then((body) => ({ response, body })))
      .then(({ response, body }) => {
        if (!response.ok) throw new Error(body.error?.message || "Could not load attendees.");
        if (active) setAttendees(body.attendees);
      })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [eventId, organizationId]);

  return (
    <section className="attendee-panel" aria-label="Attendee management">
      <div className="attendee-toolbar">
        <label className="organization-select-label">Organization<select onChange={(event) => { setEvents([]); setAttendees([]); setLoading(true); setError(""); setOrganizationId(event.target.value); }} value={organizationId}>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label>
        <label className="organization-select-label">Event<select onChange={(event) => { setAttendees([]); setLoading(true); setError(""); setEventId(event.target.value); }} value={eventId}><option value="">Choose a published event</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label>
        {eventId && attendees.length ? <a className="button button-dark attendee-export" download href={`/api/events/${encodeURIComponent(eventId)}/attendees?organizationId=${encodeURIComponent(organizationId)}&format=csv`}>Export CSV <span aria-hidden="true">&#8595;</span></a> : <button className="button button-dark attendee-export" disabled type="button">Export CSV <span aria-hidden="true">&#8595;</span></button>}
      </div>
      {error && <p className="form-message form-error" role="alert">{error}</p>}
      {loading ? <p className="table-state">Loading attendees...</p> : attendees.length ? <div className="attendee-table-wrap"><table className="attendee-table"><thead><tr><th>Name</th><th>Email</th><th>Ticket</th><th>Status</th><th>Check-in</th></tr></thead><tbody>{attendees.map((attendee) => <tr key={attendee.id}><td>{attendee.full_name}</td><td>{attendee.email}</td><td>{attendee.ticket_number || "-"}</td><td><span className="role-pill">{attendee.status}</span></td><td>{attendee.checked_in_at ? <span className="checked-in-label">Checked in</span> : "Not yet"}</td></tr>)}</tbody></table></div> : <div className="dashboard-empty dashboard-empty-compact"><span className="empty-spark" aria-hidden="true">&#10033;</span><h3>No attendees yet.</h3><p>Registrations will appear here as people reserve their place.</p></div>}
    </section>
  );
}