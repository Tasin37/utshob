"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

function rowsFrom(result, key) {
  if (Array.isArray(result?.data)) return result.data;
  return result?.data?.[key] || result?.data?.items || [];
}

export default function TeamManager({ incomingInvitations: initialIncomingInvitations = [], organizations }) {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || "");
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [incomingInvitations, setIncomingInvitations] = useState(initialIncomingInvitations);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(Boolean(organizationId));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const activeOrganization = organizations.find((organization) => organization.id === organizationId);
  const canManage = ["owner", "admin"].includes(activeOrganization?.role);

  useEffect(() => {
    let active = true;
    if (!organizationId) return undefined;

    async function loadTeam() {
      setLoading(true);
      setError("");
      const [memberResult, invitationResult] = await Promise.all([
        authClient.organization.listMembers({ query: { organizationId, limit: 100, offset: 0 } }),
        authClient.organization.listInvitations({ query: { organizationId } }),
      ]);

      if (active) {
        if (memberResult.error || invitationResult.error) {
          setError(memberResult.error?.message || invitationResult.error?.message || "Could not load this team.");
        } else {
          setMembers(rowsFrom(memberResult, "members"));
          setInvitations(rowsFrom(invitationResult, "invitations"));
        }
        setLoading(false);
      }
    }

    loadTeam();
    return () => { active = false; };
  }, [organizationId]);

  async function inviteMember(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");

    const result = await authClient.organization.inviteMember({
      email: email.trim(),
      role,
      organizationId,
    });

    if (result.error) {
      setError(result.error.message);
    } else {
      setEmail("");
      setNotice(`Invitation sent to ${email.trim()}.`);
      const refreshed = await authClient.organization.listInvitations({ query: { organizationId } });
      if (!refreshed.error) setInvitations(rowsFrom(refreshed, "invitations"));
    }
    setPending(false);
  }

  async function updateRole(memberId, nextRole) {
    setError("");
    const result = await authClient.organization.updateMemberRole({ memberId, role: nextRole, organizationId });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setMembers((current) => current.map((member) => member.id === memberId ? { ...member, role: nextRole } : member));
  }

  async function cancelInvitation(invitationId) {
    setError("");
    const result = await authClient.organization.cancelInvitation({ invitationId });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setInvitations((current) => current.filter((invitation) => invitation.id !== invitationId));
  }

  async function respondToInvitation(invitationId, action) {
    setError("");
    const result = action === "accept"
      ? await authClient.organization.acceptInvitation({ invitationId })
      : await authClient.organization.rejectInvitation({ invitationId });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setIncomingInvitations((current) => current.filter((invitation) => invitation.id !== invitationId));
    if (action === "accept") router.refresh();
  }

  if (!organizations.length) {
    return <section className="dashboard-empty"><h2>Create an organization first.</h2><p>Your team belongs to an organization workspace.</p></section>;
  }

  return (
    <>
      <div className="team-toolbar">
        <label className="organization-select-label">
          Organization
          <select onChange={(event) => setOrganizationId(event.target.value)} value={organizationId}>
            {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
          </select>
        </label>
        <div className="event-list-actions">
          <span className="workspace-role">Your role: {activeOrganization?.role}</span>
          <Link className="quiet-link" href="/dashboard/organization/new">New organization <span aria-hidden="true">+</span></Link>
        </div>
      </div>

      {canManage && (
        <form className="invite-form" onSubmit={inviteMember}>
          <div>
            <span className="workspace-overline">GROW YOUR CREW</span>
            <h2>Invite a teammate</h2>
          </div>
          <label className="invite-email-label">Email address<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="teammate@example.com" required type="email" value={email} /></label>
          <label className="invite-role-label">Role<select onChange={(event) => setRole(event.target.value)} value={role}><option value="member">Member</option><option value="admin">Admin</option></select></label>
          <button className="button button-dark" disabled={pending} type="submit">{pending ? "Sending..." : "Send invite"}<span aria-hidden="true">&#8599;</span></button>
        </form>
      )}

      {error && <p className="form-message form-error" role="alert">{error}</p>}
      {notice && <p className="form-message form-success" role="status">{notice}</p>}

      {incomingInvitations.length > 0 && (
        <section className="team-section incoming-invitations" aria-labelledby="incoming-invitations-heading">
          <div className="dashboard-section-heading"><div><span className="workspace-overline">YOU HAVE BEEN INVITED</span><h2 id="incoming-invitations-heading">Incoming invitations</h2></div><span className="table-count">{incomingInvitations.length}</span></div>
          <div className="member-list">
            {incomingInvitations.map((invitation) => (
              <div className="member-row" key={invitation.id}>
                <span className="member-avatar invitation-avatar" aria-hidden="true">&#8599;</span>
                <span className="member-identity"><strong>{invitation.organization?.name || "Organization invitation"}</strong><small>Invited as {invitation.role}</small></span>
                <button className="quiet-button invitation-reject" onClick={() => respondToInvitation(invitation.id, "reject")} type="button">Reject</button>
                <button className="button button-dark invitation-accept" onClick={() => respondToInvitation(invitation.id, "accept")} type="button">Accept <span aria-hidden="true">&#8599;</span></button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="team-section" aria-labelledby="members-heading">
        <div className="dashboard-section-heading"><div><span className="workspace-overline">THE PEOPLE</span><h2 id="members-heading">Members</h2></div><span className="table-count">{members.length}</span></div>
        {loading ? <p className="table-state">Loading members...</p> : members.length ? (
          <div className="member-list">
            {members.map((member) => (
              <div className="member-row" key={member.id}>
                <span className="member-avatar" aria-hidden="true">{member.user?.name?.slice(0, 1).toUpperCase() || member.user?.email?.slice(0, 1).toUpperCase() || "U"}</span>
                <span className="member-identity"><strong>{member.user?.name || "Utshob member"}</strong><small>{member.user?.email}</small></span>
                {canManage && member.role !== "owner" ? (
                  <label className="visually-hidden" htmlFor={`role-${member.id}`}>Role for {member.user?.email}</label>
                ) : null}
                {canManage && member.role !== "owner" ? (
                  <select id={`role-${member.id}`} className="role-select" onChange={(event) => updateRole(member.id, event.target.value)} value={member.role}>
                    <option value="member">Member</option><option value="admin">Admin</option>
                  </select>
                ) : <span className="role-pill">{member.role}</span>}
              </div>
            ))}
          </div>
        ) : <p className="table-state">No members found.</p>}
      </section>

      <section className="team-section" aria-labelledby="invitations-heading">
        <div className="dashboard-section-heading"><div><span className="workspace-overline">PENDING</span><h2 id="invitations-heading">Invitations</h2></div><span className="table-count">{invitations.length}</span></div>
        {invitations.length ? (
          <div className="member-list">
            {invitations.map((invitation) => (
              <div className="member-row" key={invitation.id}>
                <span className="member-avatar invitation-avatar" aria-hidden="true">&#8599;</span>
                <span className="member-identity"><strong>{invitation.email}</strong><small>Invited as {invitation.role}</small></span>
                <span className="role-pill">{invitation.status}</span>
                {canManage && <button className="quiet-button" onClick={() => cancelInvitation(invitation.id)} type="button">Cancel</button>}
              </div>
            ))}
          </div>
        ) : <p className="table-state">No pending invitations.</p>}
      </section>
    </>
  );
}