"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

function toSlug(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function OrganizationForm({ backendReady, userName }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function createOrganization(event) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const result = await authClient.organization.create({ name: name.trim(), slug: toSlug(slug) });
      if (result.error) throw new Error(result.error.message);
      if (result.data?.id) {
        await authClient.organization.setActive({ organizationId: result.data.id });
      }
      router.push("/dashboard");
      router.refresh();
    } catch (createError) {
      setError(createError.message || "We could not create that organization. Try a different name.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="organization-onboarding">
      <div className="onboarding-progress"><span>01</span><i /><span>02</span><i /><span>03</span></div>
      <p className="eyebrow"><span /> FIRST, YOUR CORNER OF THE WORLD</p>
      <h1>Every good gathering<br />has a <em>home base.</em></h1>
      <p className="onboarding-intro">{userName ? `Welcome, ${userName.split(" ")[0]}. ` : ""}Create an organization to keep your events and people together.</p>

      <form className="organization-form" onSubmit={createOrganization}>
        <label>
          Organization name
          <input autoComplete="organization" maxLength={100} onChange={(event) => {
            setName(event.target.value);
            if (!slugEdited) setSlug(toSlug(event.target.value));
          }} placeholder="e.g. Dhaka Design Circle" required value={name} />
        </label>
        <label>
          Workspace address
          <span className="slug-input"><span>utshob.com/o/</span><input autoCapitalize="none" maxLength={70} onChange={(event) => {
            setSlug(event.target.value);
            setSlugEdited(true);
          }} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="dhaka-design-circle" required value={slug} /></span>
        </label>
        {error && <p className="form-message form-error" role="alert">{error}</p>}
        {!backendReady && <p className="form-message form-error" role="alert">Organization services need a configured database and Better Auth secret.</p>}
        <button className="button button-dark organization-submit" disabled={!backendReady || pending} type="submit">
          {pending ? "Creating workspace..." : "Create organization"}<span aria-hidden="true">&#8599;</span>
        </button>
        <p className="form-caption">You will be the organization owner. You can invite teammates next.</p>
      </form>
    </main>
  );
}