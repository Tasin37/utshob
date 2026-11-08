"use client";

import { useEffect, useRef, useState } from "react";
import { filterEvents } from "@/lib/events/search.mjs";

const categories = ["All events"];

export function EventCard({ event }) {
  return (
    <a className="event-card" href={`/e/${event.slug}`}>
      <div
        className="event-image"
        role="img"
        aria-label={event.alt}
        style={{ backgroundImage: `url("${event.image}")` }}
      >
        <span className="event-category">{event.category}</span>
      </div>
      <div className="event-card-body">
        <p className="event-date">{event.date} <span>/</span> {event.time}</p>
        <h3>{event.title}</h3>
        <p className="event-location">{event.location}</p>
        <div className="event-card-foot">
          <span>{event.price}</span>
          <span className="arrow-mark" aria-hidden="true">&#8599;</span>
        </div>
      </div>
    </a>
  );
}

export default function HomePage({ events, featuredEvents, recommendedEvents }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All events");
  const searchInputRef = useRef(null);

  const eventCategories = [...categories, ...new Set(events.map((event) => event.category))];
  const filteredEvents = filterEvents(events, query, activeCategory);

  useEffect(() => {
    function handleSearchShortcut(event) {
      const target = event.target;
      const isEditingText = target instanceof HTMLElement && (
        target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      );

      if (event.key === "/" && !isEditingText) {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (event.key === "Escape" && target === searchInputRef.current) {
        if (searchInputRef.current.value) setQuery("");
        else searchInputRef.current.blur();
      }
    }

    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Utshob home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>utshob</span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a className="nav-active" href="#events">Discover</a>
          <a href="#categories">Categories</a>
          <a href="#organizers">For organizers</a>
        </nav>
        <div className="header-actions">
          <a className="sign-in-link" href="/sign-in">Sign in</a>
          <a className="button button-dark button-small" href="/sign-up">Host an event <span aria-hidden="true">&#8599;</span></a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-photo" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow hero-eyebrow"><span /> MAKE ROOM FOR A GOOD TIME</p>
          <h1>Your next story<br />starts <em>here.</em></h1>
          <p className="hero-copy">Find the people, places and little moments<br className="desktop-break" /> you&apos;ll be glad you showed up for.</p>
          <a className="hero-link" href="#events">Explore what&apos;s on <span aria-hidden="true">&#8595;</span></a>
        </div>
        <div className="hero-caption"><span>01 / 04</span><span>Good things are happening in Dhaka</span></div>
        <div className="hero-orbit" aria-hidden="true"><span>OUT THERE<br />IS YOUR<br />NEXT THING</span><i>&#8599;</i></div>
      </section>

      {featuredEvents.length > 0 && (
        <section className="featured-section" aria-labelledby="featured-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><span /> WORTH MAKING A PLAN FOR</p>
              <h2 id="featured-heading">Featured <em>events.</em></h2>
            </div>
            <a className="quiet-link" href="#events">See everything <span aria-hidden="true">&#8599;</span></a>
          </div>
          <div className="event-grid featured-grid">
            {featuredEvents.map((event) => <EventCard key={event.slug} event={event} />)}
          </div>
        </section>
      )}

      {recommendedEvents.length > 0 && (
        <section className="recommendation-section" aria-labelledby="recommendation-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><span /> A LITTLE NUDGE</p>
              <h2 id="recommendation-heading">You might <em>like these.</em></h2>
            </div>
            <p className="section-intro">Based on what is happening next and the kinds of events worth making time for.</p>
          </div>
          <div className="event-grid recommendation-grid">
            {recommendedEvents.map((event) => <EventCard key={event.slug} event={event} />)}
          </div>
        </section>
      )}

      <section className="discovery-section" id="events">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span /> THE GOOD STUFF, CLOSE BY</p>
            <h2>Make a date<br className="mobile-break" /> with <em>something.</em></h2>
          </div>
          <p className="section-intro">A few plans worth putting on the calendar.<br />Made for going together, or going your own way.<br /><a className="quiet-link" href="/events">Browse all events <span aria-hidden="true">&#8599;</span></a></p>
        </div>

        <div className="discovery-tools" id="categories">
          <div className="category-list" role="group" aria-label="Filter events by category">
            {eventCategories.map((category) => (
              <button
                className={`category-button${activeCategory === category ? " category-active" : ""}`}
                key={category}
                type="button"
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <label className="search-box">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events or places"
              aria-label="Search events or places"
            />
            <kbd>/</kbd>
          </label>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="event-grid" aria-live="polite">
            {filteredEvents.map((event) => <EventCard key={event.title} event={event} />)}
          </div>
        ) : (
          <div className="empty-state" aria-live="polite">
            <span className="empty-spark" aria-hidden="true">&#10033;</span>
            <h3>No plans found. Yet.</h3>
            <p>Try another search or choose a different category.</p>
            <button type="button" className="text-button" onClick={() => { setQuery(""); setActiveCategory("All events"); }}>Show all events <span aria-hidden="true">&#8599;</span></button>
          </div>
        )}

        <div className="browse-note"><span className="note-dot" /> Showing up to 6 published events around Bangladesh · <a href="/events">See all events <span aria-hidden="true">&#8599;</span></a></div>
      </section>

      <section className="organizer-band" id="organizers">
        <div className="organizer-copy">
          <p className="eyebrow"><span /> FOR THE ONES WHO BRING US TOGETHER</p>
          <h2>You bring the people.<br /><em>We&apos;ll handle the details.</em></h2>
          <p>One calm place to make your event, welcome your guests and keep the day moving.</p>
          <a className="button button-light" href="/sign-up">Start hosting <span aria-hidden="true">&#8599;</span></a>
        </div>
        <div className="organizer-art" aria-hidden="true">
          <div className="ticket-shape"><span>YOUR<br />PEOPLE<br />ARE HERE</span><b>UTSHOB<br />ADMIT ONE</b><i>&#10033;</i></div>
          <span className="art-caption">A little less admin.<br />A lot more together.</span>
        </div>
      </section>

      <footer className="site-footer">
        <a className="brand brand-footer" href="#top"><span className="brand-mark" aria-hidden="true"><span /></span><span>utshob</span></a>
        <span>Make room for a good time.</span>
        <span>Made for showing up.</span>
      </footer>
    </main>
  );
}
