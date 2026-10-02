"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

export default function InvitationAcceptance({ invitationId }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [status, setStatus] = useState("waiting");
  const [error, setError] = useState("");
  const callbackURL = `/accept-invitation/${encodeURIComponent(invitationId)}`;

  useEffect(() => {
    if (!session?.user || status !== "waiting") return undefined;
    let active = true;
    authClient.organization.acceptInvitation({ invitationId }).then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error.message);
        setStatus("error");
        return;
      }
      setStatus("accepted");
      router.push("/dashboard/team");
      router.refresh();
    }).catch((acceptError) => {
      if (active) {
        setError(acceptError.message || "This invitation could not be accepted.");
        setStatus("error");
      }
    });
    return () => { active = false; };
  }, [invitationId, router, session, status]);

  return (
    <main className="invitation-page">
      <p className="eyebrow"><span /> YOU HAVE BEEN INVITED</p>
      {isPending || (session && status === "waiting") ? <h1>Joining your team...</h1> : null}
      {!session && !isPending && <>
        <h1>There is a place for you.</h1>
        <p>Sign in or create an account with the invited email address to join this organization.</p>
        <div className="invitation-actions">
          <Link className="button button-dark" href={`/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`}>Sign in <span aria-hidden="true">&#8599;</span></Link>
          <Link className="button button-quiet" href={`/sign-up?callbackURL=${encodeURIComponent(callbackURL)}`}>Create account <span aria-hidden="true">&#8599;</span></Link>
        </div>
      </>}
      {status === "error" && <div className="setup-notice" role="alert"><strong>Invitation not accepted</strong><p>{error}</p></div>}
      {status === "accepted" && <p className="form-message form-success" role="status">Invitation accepted. Opening your team...</p>}
    </main>
  );
}