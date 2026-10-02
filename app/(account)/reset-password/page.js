import AuthForm from "@/components/auth/auth-form";
import { headers } from "next/headers";
import { getBackendConfiguration } from "@/lib/backend-config";

export const metadata = { title: "Choose a new password | Utshob" };

export default async function ResetPasswordPage({ searchParams }) {
  await headers();
  const [{ token = "", error = "" }, configuration] = await Promise.all([
    searchParams,
    Promise.resolve(getBackendConfiguration()),
  ]);

  return (
    <AuthForm
      authError={error}
      backendReady={configuration.ready}
      missing={configuration.missing}
      mode="reset-password"
      token={token}
    />
  );
}