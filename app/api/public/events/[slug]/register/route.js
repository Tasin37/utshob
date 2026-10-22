import { getServerSession } from "@/lib/auth/session";
import { registerForEvent, validateRegistration } from "@/lib/registrations/server";

export async function POST(request, { params }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: { code: "INVALID_BODY", message: "Request body must be valid JSON." } }, { status: 400 });
  }

  const parsed = validateRegistration(body);
  if (!parsed.success) {
    return Response.json({ error: { code: "INVALID_REGISTRATION", message: parsed.error.issues[0]?.message || "Check your registration details." } }, { status: 422 });
  }

  const session = await getServerSession();
  const { slug } = await params;
  const result = await registerForEvent(slug, parsed.data, session?.user?.id || null);
  if (result.error) return Response.json({ error: { code: "REGISTRATION_FAILED", message: result.error } }, { status: result.status });
  return Response.json(result, { status: 201 });
}