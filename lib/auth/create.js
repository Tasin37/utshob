import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { sendEmail } from "../email/send.js";

export function createAuth(database) {
  const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const configuredBaseURL = process.env.NODE_ENV === "development"
    ? {
      allowedHosts: ["localhost:*", "127.0.0.1:*", "192.168.*.*:3000"],
      protocol: "http",
      fallback: baseURL,
    }
    : baseURL;

  return betterAuth({
    appName: "Utshob",
    database,
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: configuredBaseURL,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      autoSignIn: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "Reset your Utshob password",
          text: `Use this link to reset your password: ${url}`,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: false,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "Verify your Utshob email",
          text: `Use this link to verify your email: ${url}`,
        });
      },
    },
    plugins: [
      organization({
        requireEmailVerificationOnInvitation: true,
        sendInvitationEmail: async ({ id, email, inviter, organization: org }) => {
          const inviteLink = `${baseURL}/accept-invitation/${id}`;
          await sendEmail({
            to: email,
            subject: `Invitation to join ${org.name} on Utshob`,
            text: `${inviter.user.name} invited you to join ${org.name}. Accept the invitation: ${inviteLink}`,
          });
        },
      }),
      nextCookies(),
    ],
  });
}