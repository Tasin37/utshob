import Link from "next/link";
import { notFound } from "next/navigation";
import RegistrationForm from "@/components/registrations/registration-form";
import { getPublicEvent } from "@/lib/events/server";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) return { title: "Event not found | Utshob" };
  return { title: `${event.title} | Utshob`, description: event.summary || event.description };
}

export default async function PublicEventPage({ params }) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) notFound();

  const eventDate = event.starts_at
    ? new Intl.DateTimeFormat("en", { dateStyle: "full", timeStyle: "short", timeZone: event.timezone }).format(event.starts_at)
    : "Date to be announced";

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
          <section className="public-event-description"><h2>About this event</h2><p>{event.description}</p></section>
          <p className="organizer-credit">Hosted by <strong>{event.organizer_name}</strong></p>
        </article>
        <aside className="public-event-details" aria-label="Event details">
          <div><span className="workspace-overline">WHEN</span><p>{eventDate}</p></div>
          <div><span className="workspace-overline">WHERE</span><p>{event.event_type === "online" ? "Online" : event.venue_name}{event.venue_address ? <><br />{event.venue_address}</> : null}</p>{event.online_url && <a href={event.online_url} rel="noreferrer" target="_blank">Event link <span aria-hidden="true">&#8599;</span></a>}</div>
          {event.tickets.length > 0 && <div className="public-ticket-list"><span className="workspace-overline">TICKETS</span>{event.tickets.map((ticket) => <p key={ticket.name}>{ticket.name}<strong>{ticket.currency} {(ticket.price_minor / 100).toFixed(2)}</strong></p>)}</div>}
          <RegistrationForm registrationMode={event.registration_mode} slug={event.slug} />
        </aside>
      </div>
    </main>
  );
}