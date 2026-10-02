const fullMonthNames = {
  jan: "january",
  feb: "february",
  mar: "march",
  apr: "april",
  may: "may",
  jun: "june",
  jul: "july",
  aug: "august",
  sep: "september",
  oct: "october",
  nov: "november",
  dec: "december",
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function expandMonthName(date) {
  const abbreviatedMonth = date.match(/^[a-z]{3}/i)?.[0]?.toLowerCase();
  return fullMonthNames[abbreviatedMonth] || "";
}

export function filterEvents(events, query, activeCategory) {
  const searchTerms = normalizeText(query).split(/\s+/).filter(Boolean);

  return events.filter((event) => {
    const matchesCategory = !activeCategory || activeCategory === "All events" || event.category === activeCategory;
    if (!matchesCategory) return false;

    const searchableText = normalizeText([
      event.title,
      event.summary,
      event.description,
      event.category,
      event.date,
      expandMonthName(event.date || ""),
      event.time,
      event.location,
      event.price,
      event.alt,
    ].join(" "));

    return searchTerms.every((term) => searchableText.includes(term));
  });
}