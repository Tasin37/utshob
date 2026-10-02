import "server-only";

import { headers } from "next/headers";
import { getBackendConfiguration } from "@/lib/backend-config";
import { getAuth } from "@/lib/auth/server";

export async function getServerSession() {
  const requestHeaders = await headers();
  if (!getBackendConfiguration().ready) return null;

  return getAuth().api.getSession({ headers: requestHeaders });
}

export async function getUserOrganizations() {
  const sessionHeaders = await headers();
  return getAuth().api.listOrganizations({ headers: sessionHeaders });
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