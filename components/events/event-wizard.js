"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { eventLocalToUtc, eventUtcToLocal } from "@/lib/events/domain.mjs";

const steps = ["Basics", "Date & place", "Tickets / RSVP", "Questions", "Branding", "Preview", "Publish"];
const categories = ["Arts & culture", "Business", "Community", "Education", "Food", "Music", "Technology", "Wellness"];

const emptyDraft = {
  organizationId: "",
  title: "",
  summary: "",
  description: "",
  category: "Community",
  eventType: "in_person",
  visibility: "public",
  timezone: "Asia/Dhaka",
  startsAt: "",
  endsAt: "",
  venueName: "",
  venueAddress: "",
  onlineUrl: "",
  capacity: "",
  coverImageUrl: "",
  registrationMode: "rsvp",
  ticket: { name: "General admission", price: "0", quantity: "" },
  attendeeQuestion: "",
};

function toPayload(draft) {
  return {
    ...draft,
    startsAt: eventLocalToUtc(draft.startsAt, draft.timezone),
    endsAt: eventLocalToUtc(draft.endsAt, draft.timezone),
    onlineUrl: draft.onlineUrl.trim() || null,
    coverImageUrl: draft.coverImageUrl.trim() || null,
    capacity: draft.capacity ? Number(draft.capacity) : null,
    ticket: {
      name: draft.ticket.name,
      price: Number(draft.ticket.price) || 0,
      quantity: draft.ticket.quantity ? Number(draft.ticket.quantity) : null,
    },
  };
}

function formatEventDate(value, timezone) {
  if (!value) return "Date to be announced";
  return new Intl.DateTimeFormat("en", { dateStyle: "full", timeStyle: "short", timeZone: timezone }).format(new Date(value));
}

export default function EventWizard({ draftId, organizations }) {
  const router = useRouter();
  const [draft, setDraft] = useState({ ...emptyDraft, organizationId: organizations[0]?.id || "" });
  const [eventId, setEventId] = useState("");
  const [slug, setSlug] = useState("");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(Boolean(draftId));
  const [pending, setPending] = useState(false);
  const [saveState, setSaveState] = useState("");
  const [error, setError] = useState("");
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (!draftId) return undefined;
    let active = true;
    fetch(`/api/events/${encodeURIComponent(draftId)}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || "Could not load this draft.");
        if (!active) return;
        const event = result.event;
        setDraft({
          organizationId: event.organizationId,
          title: event.title,
          summary: event.summary,
          description: event.description,
          category: event.category,
          eventType: event.eventType,
          visibility: event.visibility,
          timezone: event.timezone,
          startsAt: eventUtcToLocal(event.startsAt, event.timezone),
          endsAt: eventUtcToLocal(event.endsAt, event.timezone),
          venueName: event.venueName,
          venueAddress: event.venueAddress,
          onlineUrl: event.onlineUrl || "",
          capacity: event.capacity?.toString() || "",
          coverImageUrl: event.coverImageUrl || "",
          registrationMode: event.registrationMode,
          ticket: { ...event.ticket, price: event.ticket.price.toString(), quantity: event.ticket.quantity?.toString() || "" },
          attendeeQuestion: event.attendeeQuestion,
        });
        setEventId(event.id);
        setSlug(event.slug);
        if (event.status === "published") setPublished(true);
      })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [draftId]);

  useEffect(() => {
    if (!eventId || loading || published) return undefined;
    const timer = setTimeout(async () => {
      setSaveState("Saving draft...");
      try {
        const response = await fetch(`/api/events/${encodeURIComponent(eventId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPayload(draft)),
        });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error?.message || "Draft could not be saved.");
        }
        const result = await response.json();
        setSlug(result.event.slug);
        setSaveState("All changes saved");
      } catch (saveError) {
        setSaveState(saveError.message);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [draft, eventId, loading, published]);

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateTicket(field, value) {
    setDraft((current) => ({ ...current, ticket: { ...current.ticket, [field]: value } }));
  }

  async function saveDraft() {
    setPending(true);
    setError("");
    setSaveState("Saving draft...");
    try {
      const response = await fetch(eventId ? `/api/events/${encodeURIComponent(eventId)}` : "/api/events", {
        method: eventId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(draft)),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Draft could not be saved.");
      setEventId(result.event.id);
      setSlug(result.event.slug);
      setSaveState("All changes saved");
      if (!eventId) router.replace(`/dashboard/events/new?draftId=${encodeURIComponent(result.event.id)}`);
      return true;
    } catch (saveError) {
      setError(saveError.message);
      setSaveState("");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function continueStep(event) {
    event.preventDefault();
    if (step === 0 && draft.title.trim().length < 3) {
      setError("Give your event a title with at least 3 characters.");
      return;
    }
    if (step === 1) {
      if (!draft.startsAt || !draft.endsAt) {
        setError("Choose when your event starts and ends.");
        return;
      }
      if (new Date(draft.endsAt) <= new Date(draft.startsAt)) {
        setError("The end time must be after the start time.");
        return;
      }
      if (["in_person", "hybrid"].includes(draft.eventType) && !draft.venueName.trim()) {
        setError("Add a venue name before continuing.");
        return;
      }
    }

    const saved = await saveDraft();
    if (saved) setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function publishEvent() {
    if (!eventId) return;
    const saved = await saveDraft();
    if (!saved) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: draft.organizationId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "This event could not be published.");
      setSlug(result.event.slug);
      setPublished(true);
      setSaveState("");
    } catch (publishError) {
      setError(publishError.message);
    } finally {
      setPending(false);
    }
  }

  if (loading) return <p className="table-state">Opening your saved draft...</p>;
  if (!organizations.length) return <section className="dashboard-empty"><h2>Create an organization first.</h2><p>Your events belong to an organization workspace.</p><Link className="button button-dark" href="/dashboard/organization/new">Create organization <span aria-hidden="true">&#8599;</span></Link></section>;

  const datePreview = formatEventDate(eventLocalToUtc(draft.startsAt, draft.timezone), draft.timezone);

  return (
    <div className="event-wizard">
      <div className="wizard-topline">
        <div><p className="eyebrow"><span /> MAKE SOMETHING HAPPEN</p><h1>{published ? "It is out there." : eventId ? "Pick up your draft." : "Create an event."}</h1></div>
        <div className="wizard-save-state" aria-live="polite">{published ? "Published" : saveState}</div>
      </div>

      {published ? (
        <section className="publish-success" aria-live="polite">
          <span className="success-mark" aria-hidden="true">&#10003;</span>
          <p className="eyebrow"><span /> IT IS OFFICIAL</p>
          <h2>{draft.title}</h2>
          <p>Your event is published and ready to share.</p>
          <div className="published-url"><span>utshob.com/e/{slug}</span><Link href={`/e/${slug}`} target="_blank">Open event <span aria-hidden="true">&#8599;</span></Link></div>
          <Link className="button button-dark" href="/dashboard/events">Back to events <span aria-hidden="true">&#8594;</span></Link>
        </section>
      ) : (
        <>
          <ol className="wizard-steps" aria-label="Event creation steps">
            {steps.map((label, index) => <li aria-current={step === index ? "step" : undefined} className={step >= index ? "wizard-step-done" : ""} key={label}><span>{String(index + 1).padStart(2, "0")}</span>{label}</li>)}
          </ol>

          <form className="wizard-form" onSubmit={continueStep}>
            <div className="wizard-form-heading">
              <div><span className="workspace-overline">STEP {String(step + 1).padStart(2, "0")} / 07</span><h2>{steps[step]}</h2></div>
              {organizations.length > 1 && step === 0 && (
                <label className="organization-select-label">Organization<select onChange={(event) => updateField("organizationId", event.target.value)} value={draft.organizationId}>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label>
              )}
            </div>

            {step === 0 && <div className="wizard-fields">
              <label className="field-wide">Event name<input autoFocus maxLength={120} onChange={(event) => updateField("title", event.target.value)} placeholder="A name people will remember" required value={draft.title} /></label>
              <label className="field-wide">Short description<input maxLength={280} onChange={(event) => updateField("summary", event.target.value)} placeholder="The one-line version" value={draft.summary} /></label>
              <label className="field-wide">About this event<textarea maxLength={12000} onChange={(event) => updateField("description", event.target.value)} placeholder="What will people experience?" rows={6} value={draft.description} /></label>
              <label>Category<select onChange={(event) => updateField("category", event.target.value)} value={draft.category}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label>Visibility<select onChange={(event) => updateField("visibility", event.target.value)} value={draft.visibility}><option value="public">Public</option><option value="unlisted">Unlisted</option><option value="private">Private</option></select></label>
            </div>}

            {step === 1 && <div className="wizard-fields">
              <fieldset className="field-wide event-type-field"><legend>What kind of event is it?</legend><div className="segmented-control">{[["in_person", "In person"], ["online", "Online"], ["hybrid", "Hybrid"]].map(([value, label]) => <label className={draft.eventType === value ? "segment-selected" : ""} key={value}><input checked={draft.eventType === value} name="eventType" onChange={() => updateField("eventType", value)} type="radio" value={value} />{label}</label>)}</div></fieldset>
              <label>Starts<input onChange={(event) => updateField("startsAt", event.target.value)} required type="datetime-local" value={draft.startsAt} /></label>
              <label>Ends<input onChange={(event) => updateField("endsAt", event.target.value)} required type="datetime-local" value={draft.endsAt} /></label>
              <label>Time zone<select onChange={(event) => updateField("timezone", event.target.value)} value={draft.timezone}><option value="Asia/Dhaka">Bangladesh (Dhaka)</option><option value="Asia/Kolkata">India (Kolkata)</option><option value="UTC">UTC</option></select></label>
              {draft.eventType !== "online" && <label>Venue name<input maxLength={180} onChange={(event) => updateField("venueName", event.target.value)} placeholder="Venue or space" required={draft.eventType !== "online"} value={draft.venueName} /></label>}
              {draft.eventType !== "online" && <label className="field-wide">Address<input maxLength={500} onChange={(event) => updateField("venueAddress", event.target.value)} placeholder="Street, neighborhood, city" value={draft.venueAddress} /></label>}
              {draft.eventType !== "in_person" && <label className="field-wide">Online event link (optional)<input onChange={(event) => updateField("onlineUrl", event.target.value)} placeholder="https://" type="url" value={draft.onlineUrl} /></label>}
            </div>}

            {step === 2 && <div className="wizard-fields">
              <fieldset className="field-wide event-type-field"><legend>How will people join?</legend><div className="segmented-control"><label className={draft.registrationMode === "rsvp" ? "segment-selected" : ""}><input checked={draft.registrationMode === "rsvp"} name="registrationMode" onChange={() => updateField("registrationMode", "rsvp")} type="radio" />Free RSVP</label><label className={draft.registrationMode === "paid" ? "segment-selected" : ""}><input checked={draft.registrationMode === "paid"} name="registrationMode" onChange={() => updateField("registrationMode", "paid")} type="radio" />Paid ticket</label></div></fieldset>
              <label>Guest capacity<input min="1" onChange={(event) => updateField("capacity", event.target.value)} placeholder="No limit" type="number" value={draft.capacity} /></label>
              {draft.registrationMode === "paid" && <>
                <label>Ticket name<input maxLength={100} onChange={(event) => updateTicket("name", event.target.value)} required value={draft.ticket.name} /></label>
                <label>Price (BDT)<input min="0.01" onChange={(event) => updateTicket("price", event.target.value)} required step="0.01" type="number" value={draft.ticket.price} /></label>
                <label>Ticket quantity<input min="1" onChange={(event) => updateTicket("quantity", event.target.value)} placeholder="Unlimited" type="number" value={draft.ticket.quantity} /></label>
              </>}
              <p className="field-note field-wide">Payment processing is not connected yet. Ticket details are saved as a draft and will not collect payments.</p>
            </div>}

            {step === 3 && <div className="wizard-fields">
              <div className="field-wide question-intro"><span className="question-symbol" aria-hidden="true">?</span><div><strong>What should you know about your guests?</strong><p>Every registration already asks for a name and email. Add one optional question if it helps you plan.</p></div></div>
              <label className="field-wide">Question for attendees<textarea maxLength={300} onChange={(event) => updateField("attendeeQuestion", event.target.value)} placeholder="e.g. Any dietary requirements we should know about?" rows={3} value={draft.attendeeQuestion} /></label>
            </div>}

            {step === 4 && <div className="wizard-fields">
              <label className="field-wide">Cover image URL<input onChange={(event) => updateField("coverImageUrl", event.target.value)} placeholder="https://your-image.jpg" type="url" value={draft.coverImageUrl} /></label>
              <p className="field-note field-wide">Image uploads will be connected to Utshob storage in a later step. For now, use a public image URL or leave this blank.</p>
              {draft.coverImageUrl && <div className="cover-preview" role="img" aria-label="Event cover image preview" style={{ backgroundImage: `url("${draft.coverImageUrl}")` }} />}
            </div>}

            {step === 5 && <div className="event-preview">
              {draft.coverImageUrl && <div className="event-preview-cover" role="img" aria-label="Cover image" style={{ backgroundImage: `url("${draft.coverImageUrl}")` }} />}
              <div className="event-preview-content"><span className="event-preview-category">{draft.category}</span><h3>{draft.title || "Your event name"}</h3><p className="event-preview-date">{datePreview}</p><p>{draft.eventType === "online" ? "Online event" : draft.venueName || "Venue to be announced"}{draft.venueAddress ? `, ${draft.venueAddress}` : ""}</p><p className="event-preview-description">{draft.description || "Your event description will appear here."}</p><span className="preview-cta">{draft.registrationMode === "paid" ? `Tickets from ৳${draft.ticket.price}` : "Reserve your place"}</span></div>
            </div>}

            {step === 6 && <div className="publish-checklist"><p>Your event is still private until you publish it. Double-check the essentials:</p><ul><li className={draft.title.trim().length >= 3 ? "check-complete" : ""}>Event title</li><li className={draft.description.trim() ? "check-complete" : ""}>Description</li><li className={draft.startsAt && draft.endsAt ? "check-complete" : ""}>Date and time</li><li className={draft.eventType === "online" || draft.venueName.trim() ? "check-complete" : ""}>Location</li><li className="check-complete">Registration: {draft.registrationMode === "paid" ? "paid ticket draft" : "free RSVP"}</li></ul><p className="field-note">Publishing makes this event page visible according to its visibility setting. You can edit details later.</p></div>}

            {error && <p className="form-message form-error" role="alert">{error}</p>}
            <div className="wizard-actions">
              {step > 0 ? <button className="button button-quiet" onClick={() => { setError(""); setStep((current) => current - 1); }} type="button"><span aria-hidden="true">&#8592;</span> Back</button> : <Link className="button button-quiet" href="/dashboard/events">Cancel</Link>}
              {step < 6 ? <button className="button button-dark" disabled={pending} type="submit">{pending ? "Saving..." : "Save & continue"}<span aria-hidden="true">&#8594;</span></button> : <button className="button button-dark" disabled={pending || !eventId} onClick={publishEvent} type="button">{pending ? "Publishing..." : "Publish event"}<span aria-hidden="true">&#8599;</span></button>}
            </div>
          </form>

          {eventId && <p className="draft-footnote"><span className="note-dot" /> Your draft saves automatically as you work.</p>}
        </>
      )}
    </div>
  );
}