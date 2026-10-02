"use client";

import { useEffect, useRef, useState } from "react";
import { filterEvents } from "@/lib/events/search.mjs";

const categories = ["All events", "Music", "Arts & culture", "Food", "Business", "Community"];

const events = [
  {
    title: "Dhaka After Dark: Rooftop Sessions",
    category: "Music",
    date: "Oct 17, 2026",
    time: "6:30 PM",
    location: "Gulshan, Dhaka",
    price: "From ৳850",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=85",
    alt: "Crowd enjoying a live music performance",
  },
  {
    title: "The Chattogram Makers Market",
    category: "Arts & culture",
    date: "Oct 24, 2026",
    time: "11:00 AM",
    location: "DC Hill, Chattogram",
    price: "Free entry",
    image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1000&q=85",
    alt: "Audience gathered in a bright event hall",
  },
  {
    title: "Sunday Table: A Local Food Story",
    category: "Food",
    date: "Oct 25, 2026",
    time: "12:00 PM",
    location: "Dhanmondi, Dhaka",
    price: "From ৳1,200",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=85",
    alt: "Warmly lit restaurant set for a shared meal",
  },
  {
    title: "Ideas in Bloom: Design Week",
    category: "Business",
    date: "Oct 29, 2026",
    time: "9:30 AM",
    location: "Banani, Dhaka",
    price: "From ৳600",
    image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1000&q=85",
    alt: "Microphone waiting onstage before a conference session",
  },
  {
    title: "Little Sounds, Big Feelings",
    category: "Music",
    date: "Oct 31, 2026",
    time: "5:00 PM",
    location: "Shilpakala Academy, Dhaka",
    price: "From ৳400",
    image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1000&q=85",
    alt: "Singer performing under warm stage lights",
  },
  {
    title: "By the River, Together",
    category: "Community",
    date: "Nov 1, 2026",
    time: "3:00 PM",
    location: "Patenga, Chattogram",
    price: "Free entry",
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=85",
    alt: "Friends spending an afternoon together outdoors",
  },
];

function EventCard({ event }) {
  return (
    <article className="event-card">
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
    </article>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All events");
  const searchInputRef = useRef(null);

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

      <section className="discovery-section" id="events">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span /> THE GOOD STUFF, CLOSE BY</p>
            <h2>Make a date<br className="mobile-break" /> with <em>something.</em></h2>
          </div>
          <p className="section-intro">A few plans worth putting on the calendar.<br />Made for going together, or going your own way.</p>
        </div>

        <div className="discovery-tools" id="categories">
          <div className="category-list" role="group" aria-label="Filter events by category">
            {categories.map((category) => (
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

        <div className="browse-note"><span className="note-dot" /> Showing a small sample of events around Bangladesh</div>
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
