"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

const copy = {
  "sign-up": {
    eyebrow: "YOUR PEOPLE ARE HERE",
    title: "Make it happen.",
    description: "Create an account and bring your next gathering to life.",
    button: "Create account",
    alternate: "Already have an account?",
    alternateLink: "Sign in",
    alternateHref: "/sign-in",
  },
  "sign-in": {
    eyebrow: "WELCOME BACK",
    title: "Good to see you.",
    description: "Sign in to pick up where your people are.",
    button: "Sign in",
    alternate: "New to Utshob?",
    alternateLink: "Create an account",
    alternateHref: "/sign-up",
  },
  "forgot-password": {
    eyebrow: "ACCOUNT ACCESS",
    title: "A fresh start.",
    description: "We will send a password reset link to your email.",
    button: "Send reset link",
    alternate: "Remembered it?",
    alternateLink: "Sign in",
    alternateHref: "/sign-in",
  },
  "reset-password": {
    eyebrow: "ACCOUNT ACCESS",
    title: "Choose a new password.",
    description: "Use at least 8 characters for your new password.",
    button: "Update password",
    alternate: "Back to",
    alternateLink: "sign in",
    alternateHref: "/sign-in",
  },
};

export default function AuthForm({ mode, backendReady, missing = [], token = "", authError = "", callbackURL = "" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(authError ? "This link is invalid or has expired. Request a new one to continue." : "");
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const page = copy[mode];

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setCanResendVerification(false);

    if (mode === "reset-password" && password !== confirmPassword) {
      setError("Those passwords do not match.");
      return;
    }

    setPending(true);
    try {
      if (mode === "sign-up") {
        const result = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
          callbackURL: callbackURL || "/dashboard/organization/new",
        });
        if (result.error) throw new Error(result.error.message);
        setMessage("Your account is ready. Taking you to your workspace setup.");
        router.replace(callbackURL || "/dashboard/organization/new");
        router.refresh();
      } else if (mode === "sign-in") {
        const result = await authClient.signIn.email({
          email: email.trim(),
          password,
          callbackURL: callbackURL || "/dashboard",
        });
        if (result.error) throw new Error(result.error.message);
        router.push("/dashboard");
      } else if (mode === "forgot-password") {
        const result = await authClient.requestPasswordReset({
          email: email.trim(),
          redirectTo: "/reset-password",
        });
        if (result.error) throw new Error(result.error.message);
        setMessage("If an account exists for that email, a reset link is on its way.");
      } else {
        if (!token) throw new Error("This reset link is missing its token. Request a new one.");
        const result = await authClient.resetPassword({ newPassword: password, token });
        if (result.error) throw new Error(result.error.message);
        setMessage("Your password has been updated. You can sign in now.");
      }
    } catch (submissionError) {
      const submissionMessage = submissionError.message || "We could not complete that request. Please try again.";
      if (mode === "sign-in" && /(email.*verif|verif.*email)/i.test(submissionMessage)) {
        setError("Your email has not been verified yet.");
        setCanResendVerification(true);
      } else {
        setError(submissionMessage);
      }
    } finally {
      setPending(false);
    }
  }

  async function resendVerification() {
    setPending(true);
    setError("");
    setMessage("");

    try {
      const result = await authClient.sendVerificationEmail({
        email: email.trim(),
        callbackURL: "/dashboard/organization/new",
      });
      if (result.error) throw new Error(result.error.message);
      setCanResendVerification(false);
      setMessage("If this address has an unverified account, a fresh verification link is on its way.");
    } catch (resendError) {
      setError(resendError.message || "We could not send a verification email. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const readyToSubmit = backendReady && !pending;

  return (
    <main className="account-main">
      <div className="account-art" aria-hidden="true">
        <span className="account-art-spark">&#10033;</span>
        <span>GOOD THINGS<br />HAPPEN WHEN<br /><em>WE SHOW UP.</em></span>
      </div>
      <section className="account-panel" aria-labelledby="account-title">
        <p className="eyebrow"><span /> {page.eyebrow}</p>
        <h1 id="account-title">{page.title}</h1>
        <p className="account-description">{page.description}</p>

        {!backendReady ? (
          <div className="setup-notice" role="status">
            <strong>Account services need setup</strong>
            <p>Configure these server variables to enable sign in and registration:</p>
            <ul>{missing.map((key) => <li key={key}>{key}</li>)}</ul>
          </div>
        ) : (
          <form className="account-form" onSubmit={handleSubmit}>
            {mode === "sign-up" && (
              <label>
                Your name
                <input autoComplete="name" maxLength={100} onChange={(event) => setName(event.target.value)} required value={name} />
              </label>
            )}
            {mode !== "reset-password" && (
              <label>
                Email address
                <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
              </label>
            )}
            {mode !== "forgot-password" && (
              <label>
                {mode === "reset-password" ? "New password" : "Password"}
                <span className="password-input-wrap">
                  <input
                    autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                    minLength={8}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="password-toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    title={showPassword ? "Hide password" : "Show password"}
                    type="button"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </span>
              </label>
            )}
            {mode === "reset-password" && (
              <label>
                Confirm new password
                <span className="password-input-wrap">
                  <input autoComplete="new-password" minLength={8} onChange={(event) => setConfirmPassword(event.target.value)} required type={showConfirmPassword ? "text" : "password"} value={confirmPassword} />
                  <button
                    aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    title={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                    type="button"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </span>
              </label>
            )}
            {mode === "sign-in" && <Link className="forgot-link" href="/forgot-password">Forgot password?</Link>}
            {error && <p className="form-message form-error" role="alert">{error}</p>}
            {message && <p className="form-message form-success" role="status">{message}</p>}
            {canResendVerification && (
              <button className="text-button verification-resend" disabled={pending || !email.trim()} onClick={resendVerification} type="button">
                Resend verification email
              </button>
            )}
            <button className="button button-dark account-submit" disabled={!readyToSubmit} type="submit">
              {pending ? "Working..." : page.button}<span aria-hidden="true">&#8599;</span>
            </button>
          </form>
        )}

        <p className="account-alternate">{page.alternate} <Link href={page.alternateHref}>{page.alternateLink}</Link></p>
      </section>
    </main>
  );
}