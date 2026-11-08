"use client";

import { useState } from "react";

export default function ShareEventButton({ title }) {
  const [status, setStatus] = useState("");

  async function shareEvent() {
    const shareData = { title, text: `Join ${title} on Utshob`, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setStatus("Shared");
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setStatus("Link copied");
    } catch (error) {
      if (error?.name === "AbortError") return;
      setStatus("Could not share");
    }
  }

  return (
    <button className="share-event-button" onClick={shareEvent} type="button">
      <span>{status || "Share event"}</span>
      <span aria-hidden="true">&#8599;</span>
    </button>
  );
}
