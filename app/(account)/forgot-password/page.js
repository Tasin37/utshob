import AuthForm from "@/components/auth/auth-form";
import { headers } from "next/headers";
import { getBackendConfiguration, getEmailConfiguration } from "@/lib/backend-config";

export const metadata = { title: "Reset password | Utshob" };

export default async function ForgotPasswordPage() {
  await headers();
  const configuration = getBackendConfiguration();
  const emailConfiguration = getEmailConfiguration();
  return <AuthForm backendReady={configuration.ready && emailConfiguration.ready} missing={[...configuration.missing, ...emailConfiguration.missing]} mode="forgot-password" />;
}