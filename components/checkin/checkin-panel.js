"use client";

import { useEffect, useState } from "react";

export default function CheckinPanel({ organizations }) {
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || "");
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

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
      .catch((loadError) => { if (active) setError(loadError.message); });
    return () => { active = false; };
  }, [organizationId]);

  async function submit(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, qrToken, method: qrToken.trim().startsWith("{") ? "qr" : "manual" }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Check-in failed.");
      setResult(body);
      setQrToken("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="checkin-panel" aria-label="Attendee check-in">
      <div className="checkin-toolbar">
        <label className="organization-select-label">Organization<select onChange={(event) => setOrganizationId(event.target.value)} value={organizationId}>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label>
        <label className="organization-select-label">Event<select onChange={(event) => setEventId(event.target.value)} value={eventId}><option value="">Choose an event</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label>
      </div>
      <form className="checkin-form" onSubmit={submit}>
        <div><span className="workspace-overline">FAST ENTRY</span><h2>Check in a guest.</h2><p>Enter the visible ticket number or paste the QR payload from the attendee&apos;s ticket.</p></div>
        <label>Ticket number or QR payload<textarea autoFocus onChange={(event) => setQrToken(event.target.value)} placeholder="UT-ABC123 or paste QR payload" required rows={4} value={qrToken} /></label>
        {error && <p className="form-message form-error" role="alert">{error}</p>}
        {result && <div className={`checkin-result checkin-${result.status}`} role="status"><strong>{result.status === "checked_in" ? "Checked in" : "Already checked in"}</strong><span>{result.attendeeName} · {result.ticketNumber}</span><small>{new Date(result.checkedInAt).toLocaleString()}</small></div>}
        <button className="button button-dark" disabled={pending || !eventId} type="submit">{pending ? "Checking..." : "Check in guest"}<span aria-hidden="true">&#8599;</span></button>
      </form>
    </section>
  );
}