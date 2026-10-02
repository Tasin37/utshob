import "server-only";

const requiredEnvironment = ["DATABASE_URL", "BETTER_AUTH_SECRET"];

export function getBackendConfiguration() {
  const missing = requiredEnvironment.filter((name) => !process.env[name]);

  if (process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_SECRET.length < 32) {
    missing.push("BETTER_AUTH_SECRET (at least 32 characters)");
  }

  return {
    ready: missing.length === 0,
    missing,
  };
}

export function getEmailConfiguration() {
  const missing = [];
  if (process.env.EMAIL_PROVIDER !== "resend") missing.push("EMAIL_PROVIDER=resend");
  if (!process.env.EMAIL_API_KEY) missing.push("EMAIL_API_KEY");
  if (!process.env.EMAIL_FROM) missing.push("EMAIL_FROM");

  return {
    ready: missing.length === 0,
    missing,
  };
}