import { toNextJsHandler } from "better-auth/next-js";
import { getBackendConfiguration } from "@/lib/backend-config";
import { getAuth } from "@/lib/auth/server";

async function handleAuthRequest(request, method) {
  const configuration = getBackendConfiguration();
  if (!configuration.ready) {
    return Response.json(
      {
        error: {
          code: "BACKEND_NOT_CONFIGURED",
          message: "Account services are unavailable until the server environment is configured.",
          missing: configuration.missing,
        },
      },
      { status: 503 },
    );
  }

  try {
    const handler = toNextJsHandler(getAuth())[method];
    return handler(request);
  } catch {
    return Response.json(
      {
        error: {
          code: "AUTH_SERVICE_UNAVAILABLE",
          message: "Account services are temporarily unavailable.",
        },
      },
      { status: 503 },
    );
  }
}

export const GET = (request) => handleAuthRequest(request, "GET");
export const POST = (request) => handleAuthRequest(request, "POST");