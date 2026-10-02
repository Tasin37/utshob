import { redirect } from "next/navigation";
import OrganizationForm from "@/components/organizations/organization-form";
import { getBackendConfiguration } from "@/lib/backend-config";
import { getServerSession } from "@/lib/auth/session";

export const metadata = { title: "Create an organization | Utshob" };

export default async function NewOrganizationPage() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  const configuration = getBackendConfiguration();
  return <OrganizationForm backendReady={configuration.ready} userName={session.user.name} />;
}