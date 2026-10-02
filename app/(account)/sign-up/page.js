import AuthForm from "@/components/auth/auth-form";
import { headers } from "next/headers";
import { getBackendConfiguration } from "@/lib/backend-config";

export const metadata = { title: "Create account | Utshob" };

function safeCallbackURL(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard/organization/new";
}

export default async function SignUpPage({ searchParams }) {
  await headers();
  const { callbackURL } = await searchParams;
  const configuration = getBackendConfiguration();
  return <AuthForm backendReady={configuration.ready} callbackURL={safeCallbackURL(callbackURL)} missing={configuration.missing} mode="sign-up" />;
}