"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function RegistrationForm({ slug, registrationMode }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const response = await fetch(`/api/public/events/${encodeURIComponent(slug)}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, acceptedTerms }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Registration failed.");
      setConfirmation(result);
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setPending(false);
    }
  }

  if (confirmation) {
    return (
      <div className="registration-confirmation" role="status">
        <span className="success-mark" aria-hidden="true">&#10003;</span>
        <p className="eyebrow"><span /> YOU ARE ON THE LIST</p>
        <h2>See you there, {confirmation.registration.full_name.split(" ")[0]}.</h2>
        <p>Your RSVP for {confirmation.event.title} is confirmed.</p>
        <div className="ticket-card">
          <QRCodeCanvas
            bgColor="#f4f8ed"
            fgColor="#183d31"
            level="M"
            size={152}
            value={JSON.stringify({ event: confirmation.event.slug, ticket: confirmation.ticket.token })}
          />
          <span className="workspace-overline">YOUR TICKET</span>
          <strong>{confirmation.ticket.ticket_number}</strong>
          <small>Show this code at check-in.</small>
        </div>
      </div>
    );
  }

  return (
    <form className="registration-form" onSubmit={submit}>
      <div><span className="workspace-overline">RESERVE YOUR PLACE</span><h2>{registrationMode === "rsvp" ? "Join the gathering." : "Tickets are coming soon."}</h2></div>
      {registrationMode === "rsvp" ? <>
        <label>Full name<input autoComplete="name" onChange={(event) => setFullName(event.target.value)} required value={fullName} /></label>
        <label>Email address<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
        <label>Phone <span className="optional-label">optional</span><input autoComplete="tel" onChange={(event) => setPhone(event.target.value)} value={phone} /></label>
        <label className="terms-check"><input checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} required type="checkbox" />I agree to receive event-related updates.</label>
        {error && <p className="form-message form-error" role="alert">{error}</p>}
        <button className="button button-dark public-register-button" disabled={pending} type="submit">{pending ? "Reserving..." : "Reserve my place"}<span aria-hidden="true">&#8599;</span></button>
      </> : <p className="registration-note">Paid registration will be enabled after payments are connected.</p>}
    </form>
  );
}