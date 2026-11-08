import Link from "next/link";
import { notFound } from "next/navigation";
import RegistrationForm from "@/components/registrations/registration-form";
import ShareEventButton from "@/components/events/share-event-button";
import { getPublicEvent } from "@/lib/events/server";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) return { title: "Event not found | Utshob" };
  const description = event.summary || event.description;
  return {
    title: `${event.title} | Utshob`,
    description,
    openGraph: {
      title: event.title,
      description,
      type: "website",
      ...(event.cover_image_url ? { images: [{ url: event.cover_image_url, alt: `${event.title} cover image` }] } : {}),
    },
    twitter: {
      card: event.cover_image_url ? "summary_large_image" : "summary",
      title: event.title,
      description,
      ...(event.cover_image_url ? { images: [event.cover_image_url] } : {}),
    },
  };
}

export default async function PublicEventPage({ params }) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) notFound();

  const eventDate = event.starts_at
    ? new Intl.DateTimeFormat("en", { dateStyle: "full", timeStyle: "short", timeZone: event.timezone }).format(event.starts_at)
    : "Date to be announced";
  const recurrenceLabel = event.recurrence_frequency === "weekly"
    ? `Repeats every ${event.recurrence_interval === 1 ? "" : `${event.recurrence_interval} `}week${event.recurrence_interval === 1 ? "" : "s"}`
    : event.recurrence_frequency === "monthly"
      ? `Repeats every ${event.recurrence_interval === 1 ? "" : `${event.recurrence_interval} `}month${event.recurrence_interval === 1 ? "" : "s"}`
      : null;

  return (
    <main className="public-event-page">
      <header className="public-event-header">
        <Link className="brand" href="/" aria-label="Utshob home"><span className="brand-mark" aria-hidden="true"><span /></span><span>utshob</span></Link>
        <Link className="quiet-link" href="/">Explore events <span aria-hidden="true">&#8599;</span></Link>
      </header>
      {event.cover_image_url
        ? <div className="public-event-cover" role="img" aria-label={`${event.title} cover image`} style={{ backgroundImage: `url("${event.cover_image_url}")` }} />
        : <div className="public-event-cover public-event-cover-empty" aria-hidden="true"><span>&#10033;</span></div>}
      <div className="public-event-layout">
        <article className="public-event-content">
          <p className="eyebrow"><span /> {event.category.toUpperCase()}</p>
          <h1>{event.title}</h1>
          {event.summary && <p className="public-event-summary">{event.summary}</p>}
          <ShareEventButton title={event.title} />
          <section className="public-event-description"><h2>About this event</h2><p>{event.description}</p></section>
          {event.faqs.length > 0 && <section className="public-event-faqs"><h2>Frequently asked questions</h2>{event.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</section>}
          {event.speakers.length > 0 && <section className="public-event-speakers"><h2>Meet the speakers</h2><div className="speaker-grid">{event.speakers.map((speaker) => <article className="speaker-card" key={speaker.id}>{speaker.photo_url ? <img src={speaker.photo_url} alt="" /> : <div className="speaker-avatar" aria-hidden="true">{speaker.name.slice(0, 1)}</div>}<div><h3>{speaker.name}</h3>{speaker.role && <p className="speaker-role">{speaker.role}</p>}{speaker.bio && <p>{speaker.bio}</p>}</div></article>)}</div></section>}
          {event.sponsors.length > 0 && <section className="public-event-sponsors"><h2>With support from</h2><div className="sponsor-grid">{event.sponsors.map((sponsor) => <article className="sponsor-card" key={sponsor.id}>{sponsor.logo_url ? <img src={sponsor.logo_url} alt={`${sponsor.name} logo`} /> : <strong>{sponsor.name}</strong>}<div>{sponsor.tagline && <p>{sponsor.tagline}</p>}{sponsor.website_url && <a href={sponsor.website_url} rel="noreferrer" target="_blank">Visit sponsor <span aria-hidden="true">&#8599;</span></a>}</div></article>)}</div></section>}
          {event.exhibitors.length > 0 && <section className="public-event-exhibitors"><h2>Explore exhibitors</h2><div className="exhibitor-grid">{event.exhibitors.map((exhibitor) => <article className="exhibitor-card" key={exhibitor.id}>{exhibitor.logo_url ? <img src={exhibitor.logo_url} alt={`${exhibitor.name} logo`} /> : <strong>{exhibitor.name}</strong>}<div>{exhibitor.booth_label && <span className="exhibitor-booth">{exhibitor.booth_label}</span>}{exhibitor.description && <p>{exhibitor.description}</p>}{exhibitor.website_url && <a href={exhibitor.website_url} rel="noreferrer" target="_blank">Visit exhibitor <span aria-hidden="true">&#8599;</span></a>}</div></article>)}</div></section>}
          <p className="organizer-credit">Hosted by <strong>{event.organizer_name}</strong></p>
        </article>
        <aside className="public-event-details" aria-label="Event details">
          <div><span className="workspace-overline">WHEN</span><p>{eventDate}</p>{recurrenceLabel && <p className="event-recurrence-label">{recurrenceLabel}</p>}</div>
          {event.starts_at && event.ends_at && <a className="calendar-reminder-link" href={`/api/public/events/${encodeURIComponent(event.slug)}/calendar`}>Add to calendar <span aria-hidden="true">&#8599;</span></a>}
          <div><span className="workspace-overline">WHERE</span><p>{event.event_type === "online" ? "Online event" : event.event_type === "hybrid" ? <><strong>In person:</strong> {event.venue_name || "Venue to be announced"}{event.venue_address ? <><br />{event.venue_address}</> : null}<br /><strong>Online:</strong> {event.online_url ? "Join online" : "Access details to be announced"}</> : <>{event.venue_name || "Venue to be announced"}{event.venue_address ? <><br />{event.venue_address}</> : null}</>}</p>{event.online_url && <a href={event.online_url} rel="noreferrer" target="_blank">{event.event_type === "hybrid" ? "Join online" : "Event link"} <span aria-hidden="true">&#8599;</span></a>}</div>
          {event.tickets.length > 0 && <div className="public-ticket-list"><span className="workspace-overline">TICKETS</span>{event.tickets.map((ticket) => <p key={ticket.name}>{ticket.name}<strong>{ticket.currency} {(ticket.price_minor / 100).toFixed(2)}</strong></p>)}</div>}
          <RegistrationForm
            eventId={event.id}
            registrationMode={event.registration_mode}
            slug={event.slug}
            ticket={event.tickets[0] || null}
          />
        </aside>
      </div>
    </main>
  );
}