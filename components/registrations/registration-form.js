"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function RegistrationForm({ eventId, slug, registrationMode, ticket }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [paymentStep, setPaymentStep] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [promoCode, setPromoCode] = useState("");

  async function readResponse(response) {
    const text = await response.text();
    if (!text) throw new Error("The payment service returned an empty response.");
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("The payment service returned an invalid response.");
    }
  }

  async function beginPayment() {
    setPending(true);
    setError("");

    try {
      if (!ticket) throw new Error("No ticket type is currently available.");
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          ticketTypeId: ticket.id,
          quantity: 1,
          idempotencyKey: window.crypto.randomUUID(),
          promoCode: promoCode.trim() || undefined,
        }),
      });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(result.error?.message || "Could not start payment.");
      setPaymentStep({ order: result.order, bkashNumber: result.bkashNumber });
    } catch (paymentError) {
      setError(paymentError.message);
    } finally {
      setPending(false);
    }
  }

  async function submitPayment(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(paymentStep.order.id)}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });
      const result = await readResponse(response);
      if (!response.ok) throw new Error(result.error?.message || "Could not confirm payment.");
      setConfirmation({ payment: true, order: result.order, status: "paid", tickets: result.order.tickets });
    } catch (paymentError) {
      setError(paymentError.message);
    } finally {
      setPending(false);
    }
  }

  function closePaymentModal() {
    setPaymentStep(null);
    setTransactionId("");
    setError("");
  }

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
      const result = await readResponse(response);
      if (!response.ok) throw new Error(result.error?.message || "Registration failed.");
      setConfirmation(result);
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setPending(false);
    }
  }

  if (confirmation) {
    if (confirmation.payment) {
      return (
        <div className="registration-confirmation" role="status">
          <span className="success-mark" aria-hidden="true">&#10003;</span>
          <p className="eyebrow"><span /> PAYMENT SUBMITTED</p>
          <h2>{confirmation.status === "paid" ? "Your ticket is confirmed." : confirmation.status === "failed" || confirmation.status === "cancelled" ? "Payment was not completed." : "Your ticket is being confirmed."}</h2>
          <p>{confirmation.status === "paid" ? "Your payment was confirmed and your ticket has been issued." : confirmation.status === "failed" || confirmation.status === "cancelled" ? "No charge was completed. You can try again." : `We received payment for order ${confirmation.order.id}. Waiting for the payment provider webhook.`}</p>
          {confirmation.tickets?.length > 0 && (
            <div className="ticket-card">
              <QRCodeCanvas
                bgColor="#f4f8ed"
                fgColor="#183d31"
                level="M"
                size={152}
                value={confirmation.tickets[0].ticket_number}
              />
              <span className="workspace-overline">YOUR TICKET</span>
              {confirmation.tickets.map((ticketItem) => (
                <div key={ticketItem.ticket_number}>
                  <strong>{ticketItem.ticket_number}</strong>
                  <small>{ticketItem.status === "issued" ? "Ready for check-in." : "Unavailable."}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="registration-confirmation" role="status">
        <span className="success-mark" aria-hidden="true">&#10003;</span>
        <p className="eyebrow"><span /> {confirmation.waitlisted ? "WAITLISTED" : "YOU ARE ON THE LIST"}</p>
        <h2>{confirmation.waitlisted ? "You are on the waitlist." : `See you there, ${confirmation.registration.full_name.split(" ")[0]}.`}</h2>
        <p>{confirmation.waitlisted ? `We will let you know if a place opens for ${confirmation.event.title}.` : `Your RSVP for ${confirmation.event.title} is confirmed.`}</p>
        {confirmation.waitlisted ? null : (
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
        )}
      </div>
    );
  }

  return (
    <form className="registration-form" onSubmit={registrationMode === "rsvp" ? submit : submitPayment}>
      <div><span className="workspace-overline">RESERVE YOUR PLACE</span><h2>{registrationMode === "rsvp" ? "Join the gathering." : "Get your ticket."}</h2></div>
      {registrationMode === "rsvp" ? <>
        <label>Full name<input autoComplete="name" onChange={(event) => setFullName(event.target.value)} required value={fullName} /></label>
        <label>Email address<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
        <label>Phone <span className="optional-label">optional</span><input autoComplete="tel" onChange={(event) => setPhone(event.target.value)} value={phone} /></label>
        <label className="terms-check"><input checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} required type="checkbox" />I agree to receive event-related updates.</label>
        {error && <p className="form-message form-error" role="alert">{error}</p>}
        <button className="button button-dark public-register-button" disabled={pending} type="submit">{pending ? "Reserving..." : "Reserve my place"}<span aria-hidden="true">&#8599;</span></button>
      </> : paymentStep ? (
        <>
          <div className="manual-payment-modal" role="dialog" aria-modal="true" aria-labelledby="bkash-payment-title">
            <button className="manual-payment-modal-close" onClick={closePaymentModal} type="button" aria-label="Close payment instructions">
              &#10005;
            </button>
            <p className="workspace-overline">MANUAL PAYMENT</p>
            <h3 id="bkash-payment-title">Pay with bKash</h3>
            <p>Send <strong>{ticket.currency} {(paymentStep.order.amountMinor / 100).toFixed(2)}</strong> using bKash Send Money to:</p>
            <strong className="payment-number">{paymentStep.bkashNumber}</strong>
            <label>bKash transaction ID<input autoComplete="off" onChange={(event) => setTransactionId(event.target.value)} placeholder="Example: 8N7A2B3C" required value={transactionId} /></label>
            <p className="registration-note">After sending the money, enter the transaction ID to receive your ticket.</p>
          </div>
          {error && <p className="form-message form-error" role="alert">{error}</p>}
          <button className="button button-dark public-register-button" disabled={pending || !transactionId.trim()} type="submit">
            {pending ? "Confirming..." : "I have sent the payment"}
            <span aria-hidden="true">&#8599;</span>
          </button>
        </>
      ) : (
        <>
          <label>Promo code <span className="optional-label">optional</span><input autoComplete="off" onChange={(event) => setPromoCode(event.target.value)} placeholder="Example: EARLYBIRD" value={promoCode} /></label>
          <p className="registration-note">Secure checkout for {ticket ? `${ticket.currency} ${(ticket.price_minor / 100).toFixed(2)}` : "this event"}.</p>
          {error && <p className="form-message form-error" role="alert">{error}</p>}
          <button className="button button-dark public-register-button" disabled={pending} onClick={beginPayment} type="button">
            {pending ? "Starting checkout..." : "Continue to payment"}<span aria-hidden="true">&#8599;</span>
          </button>
        </>
      )}
    </form>
  );
}