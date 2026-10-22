import "server-only";

import { headers } from "next/headers";
import { getBackendConfiguration } from "@/lib/backend-config";
import { getAuth } from "@/lib/auth/server";
import { getPool } from "@/lib/db/pool";

export async function getServerSession() {
  const requestHeaders = await headers();
  if (!getBackendConfiguration().ready) return null;

  return getAuth().api.getSession({ headers: requestHeaders });
}

export async function getUserOrganizations() {
  const sessionHeaders = await headers();
  const organizations = await getAuth().api.listOrganizations({ headers: sessionHeaders });
  const session = await getAuth().api.getSession({ headers: sessionHeaders });
  if (!session) return [];

  return Promise.all(organizations.map(async (organization) => {
    const fullOrganization = await getAuth().api.getFullOrganization({
      headers: sessionHeaders,
      query: { organizationId: organization.id, membersLimit: 1000 },
    });
    const member = fullOrganization?.members?.find((candidate) => candidate.userId === session.user.id);
    return { ...organization, member: member ? { role: member.role } : null };
  }));
}

export async function requireOrganizationRole(organizationId, roles) {
  const session = await getServerSession();
  if (!session) return { allowed: false, status: 401 };

  const organization = await getAuth().api.getFullOrganization({
    headers: await headers(),
    query: { organizationId, membersLimit: 1000 },
  });

  if (!organization) return { allowed: false, status: 404 };

  const membership = organization.members?.find((member) => member.userId === session.user.id);
  if (!membership) return { allowed: false, status: 403 };
  if (!roles.includes(membership.role)) return { allowed: false, status: 403 };

  return { allowed: true, session, organization, membership };
}

export async function getUserInvitations() {
  const sessionHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: sessionHeaders });
  if (!session) return [];

  const result = await getPool().query(
    `SELECT invitation.id, invitation.role, invitation.status,
      organization.name AS organization_name
     FROM invitation
     JOIN organization ON organization.id = invitation."organizationId"
     WHERE lower(invitation.email) = lower($1)
       AND invitation.status = 'pending'
       AND invitation."expiresAt" > NOW()
     ORDER BY invitation."createdAt" DESC`,
    [session.user.email],
  );

  return result.rows.map((invitation) => ({
    id: invitation.id,
    role: invitation.role,
    status: invitation.status,
    organization: { name: invitation.organization_name },
  }));
}