import InvitationAcceptance from "@/components/organizations/invitation-acceptance";

export const metadata = { title: "Accept invitation | Utshob" };

export default async function AcceptInvitationPage({ params }) {
  const { invitationId } = await params;
  return <InvitationAcceptance invitationId={invitationId} />;
}