"use client";

import { useEffect, useState } from "react";

const metricLabels = [
  ["registrations", "Registrations"],
  ["ticketsIssued", "Tickets issued"],
  ["checkins", "Checked in"],
  ["checkinRate", "Check-in rate", "%"],
];

export default function AnalyticsPanel({ organizations }) {
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || "");
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(organizationId));

  useEffect(() => {
    if (!organizationId) return undefined;
    let active = true;
    fetch(`/api/events?organizationId=${encodeURIComponent(organizationId)}`)
      .then((response) => response.json().then((body) => ({ response, body })))
      .then(({ response, body }) => {
        if (!response.ok) throw new Error(body.error?.message || "Could not load events.");
        if (active) {
          const publishedEvents = body.events.filter((event) => event.status === "published");
          setEvents(publishedEvents);
          setEventId((current) => publishedEvents.some((event) => event.id === current) ? current : publishedEvents[0]?.id || "");
        }
      })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [organizationId]);

  useEffect(() => {
    if (!eventId || !organizationId) return undefined;
    let active = true;
    fetch(`/api/events/${encodeURIComponent(eventId)}/analytics?organizationId=${encodeURIComponent(organizationId)}`)
      .then((response) => response.json().then((body) => ({ response, body })))
      .then(({ response, body }) => {
        if (!response.ok) throw new Error(body.error?.message || "Could not load analytics.");
        if (active) setAnalytics(body);
      })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [eventId, organizationId]);

  return (
    <section className="analytics-panel" aria-label="Event analytics">
      <div className="analytics-toolbar">
        <label className="organization-select-label">Organization<select onChange={(event) => { setEvents([]); setEventId(""); setAnalytics(null); setLoading(true); setError(""); setOrganizationId(event.target.value); }} value={organizationId}>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label>
        <label className="organization-select-label">Event<select onChange={(event) => { setAnalytics(null); setLoading(true); setError(""); setEventId(event.target.value); }} value={eventId}><option value="">Choose a published event</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label>
      </div>
      {error && <p className="form-message form-error" role="alert">{error}</p>}
      {loading && !analytics ? <p className="table-state">Loading analytics...</p> : analytics ? <>
        <div className="analytics-heading"><div><span className="workspace-overline">LIVE EVENT PULSE</span><h2>{analytics.event.title}</h2></div><span className={`status-pill status-${analytics.event.status}`}>{analytics.event.status}</span></div>
        <div className="metric-grid">{metricLabels.map(([key, label, suffix = ""]) => <div className="metric-card" key={key}><span>{label}</span><strong>{analytics.metrics[key]}{suffix}</strong></div>)}</div>
        <div className="analytics-lower-grid">
          <section className="analytics-card"><span className="workspace-overline">REGISTRATIONS BY DAY</span><h3>Recent momentum</h3>{analytics.registrationsByDay.length ? <div className="analytics-bars">{analytics.registrationsByDay.map((item) => <div className="analytics-bar-row" key={item.day}><span>{item.day}</span><div><i style={{ width: `${Math.max((item.count / Math.max(...analytics.registrationsByDay.map((entry) => entry.count), 1)) * 100, 7)}%` }} /></div><strong>{item.count}</strong></div>)}</div> : <p className="table-state">No confirmed registrations yet.</p>}</section>
          <section className="analytics-card"><span className="workspace-overline">CAPACITY</span><h3>Room left</h3><strong className="capacity-number">{analytics.metrics.capacityRemaining === null ? "Unlimited" : analytics.metrics.capacityRemaining}</strong><p>{analytics.metrics.capacityRemaining === null ? "This event has no capacity limit." : "places remaining"}</p><p className="analytics-muted">{analytics.metrics.cancelled} cancelled registration{analytics.metrics.cancelled === 1 ? "" : "s"}.</p></section>
        </div>
      </> : <div className="dashboard-empty dashboard-empty-compact"><span className="empty-spark" aria-hidden="true">&#10033;</span><h3>Your event story will show here.</h3><p>Publish an event to start tracking registrations and attendance.</p></div>}
    </section>
  );
}