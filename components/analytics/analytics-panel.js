"use client";

import { useEffect, useState } from "react";

const metricLabels = [
  ["registrations", "Registrations"],
  ["ticketsIssued", "Tickets issued"],
  ["checkins", "Checked in"],
  ["attendanceRate", "Attendance rate", "%"],
  ["paidOrders", "Paid orders"],
  ["revenueMinor", "Revenue", "৳"],
  ["averageOrderValueMinor", "Average order", "৳"],
  ["sellThroughRate", "Sell-through rate", "%"],
];

export default function AnalyticsPanel({ organizations }) {
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || "");
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(organizationId));
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState(null);
  const [assistantPending, setAssistantPending] = useState(false);
  const [assistantError, setAssistantError] = useState("");
  const [announcementGoal, setAnnouncementGoal] = useState("reminder");
  const [announcement, setAnnouncement] = useState(null);
  const [announcementPending, setAnnouncementPending] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");

  async function askAssistant(event) {
    event.preventDefault();
    setAssistantPending(true);
    setAssistantError("");
    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, eventId, question: assistantQuestion }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "The assistant could not answer.");
      setAssistantAnswer(result);
      setAssistantQuestion("");
    } catch (askError) {
      setAssistantError(askError.message);
    } finally {
      setAssistantPending(false);
    }
  }

  async function draftAnnouncement(event) {
    event.preventDefault();
    setAnnouncementPending(true);
    setAnnouncementError("");
    try {
      const response = await fetch("/api/ai/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, eventId, goal: announcementGoal }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "The announcement could not be drafted.");
      setAnnouncement(result);
    } catch (draftError) {
      setAnnouncementError(draftError.message);
    } finally {
      setAnnouncementPending(false);
    }
  }

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
        <div className="metric-grid">{metricLabels.map(([key, label, suffix = ""]) => {
          const value = analytics.metrics[key];
          const isMoney = key === "revenueMinor" || key === "averageOrderValueMinor";
          return <div className="metric-card" key={key}><span>{label}</span><strong>{value === null ? "N/A" : isMoney ? `${suffix}${(value / 100).toLocaleString("en-BD", { maximumFractionDigits: 0 })}` : `${value}${suffix}`}</strong></div>;
        })}</div>
        <div className="analytics-lower-grid">
          <section className="analytics-card"><span className="workspace-overline">REGISTRATIONS BY DAY</span><h3>Recent momentum</h3>{analytics.registrationsByDay.length ? <div className="analytics-bars">{analytics.registrationsByDay.map((item) => <div className="analytics-bar-row" key={item.day}><span>{item.day}</span><div><i style={{ width: `${Math.max((item.count / Math.max(...analytics.registrationsByDay.map((entry) => entry.count), 1)) * 100, 7)}%` }} /></div><strong>{item.count}</strong></div>)}</div> : <p className="table-state">No confirmed registrations yet.</p>}</section>
          <section className="analytics-card"><span className="workspace-overline">CAPACITY</span><h3>Room left</h3><strong className="capacity-number">{analytics.metrics.capacityRemaining === null ? "Unlimited" : analytics.metrics.capacityRemaining}</strong><p>{analytics.metrics.capacityRemaining === null ? "This event has no capacity limit." : "places remaining"}</p><p className="analytics-muted">{analytics.metrics.cancelled} cancelled registration{analytics.metrics.cancelled === 1 ? "" : "s"}.</p></section>
          <section className="analytics-card"><span className="workspace-overline">TICKET MIX</span><h3>What people choose</h3>{analytics.ticketsByType.length ? <div className="analytics-tier-list">{analytics.ticketsByType.map((item) => <div className="analytics-tier-row" key={item.name}><span>{item.name}</span><strong>{item.sold}</strong><div><i style={{ width: `${Math.max((item.sold / Math.max(...analytics.ticketsByType.map((entry) => entry.sold), 1)) * 100, 4)}%` }} /></div></div>)}</div> : <p className="table-state">No ticket sales yet.</p>}</section>
          <section className="analytics-card"><span className="workspace-overline">CHECK-IN TREND</span><h3>Attendance pulse</h3>{analytics.checkinsByDay.length ? <div className="analytics-bars analytics-checkin-bars">{analytics.checkinsByDay.map((item) => <div className="analytics-bar-row" key={item.day}><span>{item.day}</span><div><i style={{ width: `${Math.max((item.count / Math.max(...analytics.checkinsByDay.map((entry) => entry.count), 1)) * 100, 7)}%` }} /></div><strong>{item.count}</strong></div>)}</div> : <p className="table-state">No check-ins yet.</p>}</section>
        </div>
        <section className="analytics-assistant">
          <div><span className="workspace-overline">ORGANIZER ASSISTANT</span><h3>Ask about this event</h3><p>Answers use the live analytics shown above. The assistant cannot change your event.</p></div>
          <form onSubmit={askAssistant}><input maxLength={1000} onChange={(event) => setAssistantQuestion(event.target.value)} placeholder="What should I focus on before the event?" value={assistantQuestion} /><button className="button button-dark" disabled={assistantPending || assistantQuestion.trim().length < 5} type="submit">{assistantPending ? "Thinking..." : "Ask"} <span aria-hidden="true">&#8594;</span></button></form>
          {assistantError && <p className="ai-error" role="alert">{assistantError}</p>}
          {assistantAnswer && <div className="assistant-answer"><p>{assistantAnswer.answer}</p><small>Sources: {assistantAnswer.sources.join(", ")}</small>{assistantAnswer.suggestedActions.length > 0 && <ul>{assistantAnswer.suggestedActions.map((action) => <li key={action}>{action}</li>)}</ul>}</div>}
        </section>
        <section className="analytics-assistant">
          <div><span className="workspace-overline">AI DRAFT</span><h3>Draft an attendee announcement</h3><p>Generate reviewable copy from this event&apos;s authorized analytics context. Nothing is sent automatically.</p></div>
          <form onSubmit={draftAnnouncement}><select aria-label="Announcement goal" onChange={(event) => setAnnouncementGoal(event.target.value)} value={announcementGoal}><option value="reminder">Event reminder</option><option value="last-chance">Last chance</option><option value="thank-you">Thank you</option></select><button className="button button-dark" disabled={announcementPending} type="submit">{announcementPending ? "Drafting..." : "Draft announcement"} <span aria-hidden="true">&#8594;</span></button></form>
          {announcementError && <p className="ai-error" role="alert">{announcementError}</p>}
          {announcement && <div className="assistant-answer"><strong>{announcement.subject}</strong><p>{announcement.body}</p><small>{announcement.audienceNote}</small></div>}
        </section>
      </> : <div className="dashboard-empty dashboard-empty-compact"><span className="empty-spark" aria-hidden="true">&#10033;</span><h3>Your event story will show here.</h3><p>Publish an event to start tracking registrations and attendance.</p></div>}
    </section>
  );
}