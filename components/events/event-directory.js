"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { filterEvents } from "@/lib/events/search.mjs";
import { EventCard } from "@/components/home-page";

const pageSize = 6;

export default function EventDirectory({ events }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All events");
  const [page, setPage] = useState(1);
  const categories = ["All events", ...new Set(events.map((event) => event.category))];
  const filteredEvents = useMemo(() => filterEvents(events, query, activeCategory), [events, query, activeCategory]);
  const pageCount = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const visibleEvents = filteredEvents.slice((page - 1) * pageSize, page * pageSize);

  function updateQuery(value) {
    setQuery(value);
    setPage(1);
  }

  function updateCategory(value) {
    setActiveCategory(value);
    setPage(1);
  }

  return (
    <main className="event-directory">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Utshob home"><span className="brand-mark" aria-hidden="true"><span /></span><span>utshob</span></Link>
        <Link className="quiet-link" href="/">Back home <span aria-hidden="true">&#8599;</span></Link>
      </header>
      <section className="directory-content" aria-labelledby="directory-heading">
        <div className="section-heading">
          <div><p className="eyebrow"><span /> THE FULL CALENDAR</p><h1 id="directory-heading">Find your <em>next thing.</em></h1></div>
          <p className="section-intro">Browse every published event, six at a time.</p>
        </div>
        <div className="discovery-tools">
          <div className="category-list" role="group" aria-label="Filter events by category">
            {categories.map((category) => <button className={`category-button${activeCategory === category ? " category-active" : ""}`} key={category} type="button" aria-pressed={activeCategory === category} onClick={() => updateCategory(category)}>{category}</button>)}
          </div>
          <label className="search-box">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
            <input type="search" value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Search events or places" aria-label="Search events or places" />
          </label>
        </div>
        {visibleEvents.length > 0 ? <div className="event-grid" aria-live="polite">{visibleEvents.map((event) => <EventCard key={event.slug} event={event} />)}</div> : <div className="empty-state"><span className="empty-spark" aria-hidden="true">&#10033;</span><h2>No plans found.</h2><p>Try another search or category.</p><button type="button" className="text-button" onClick={() => { updateQuery(""); updateCategory("All events"); }}>Show all events <span aria-hidden="true">&#8599;</span></button></div>}
        {pageCount > 1 && <nav className="directory-pagination" aria-label="Event pages"><button className="button button-outline" disabled={page === 1} onClick={() => setPage((current) => current - 1)} type="button">Previous</button><span>Page {page} of {pageCount}</span><button className="button button-outline" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)} type="button">Next</button></nav>}
      </section>
    </main>
  );
}
