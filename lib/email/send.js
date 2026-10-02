export async function sendEmail({ to, subject, text }) {
  if (process.env.EMAIL_PROVIDER !== "resend") {
    throw new Error("Configure EMAIL_PROVIDER=resend to enable account emails.");
  }

  if (!process.env.EMAIL_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error("EMAIL_API_KEY and EMAIL_FROM are required to send account emails.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject,
      text,
    }),
  });

  if (response.status === 401) {
    throw new Error("Resend rejected EMAIL_API_KEY. Create a new Resend API key and update .env.local.");
  }

  if (response.status === 403) {
    throw new Error("Resend rejected EMAIL_FROM or this recipient. Check the sender domain and test-mode recipient rules.");
  }

  if (!response.ok) {
    throw new Error(`Resend could not send this email (HTTP ${response.status}).`);
  }
}