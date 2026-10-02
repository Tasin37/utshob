import "server-only";

import { getBackendConfiguration } from "@/lib/backend-config";
import { createAuth } from "@/lib/auth/create";
import { getPool } from "@/lib/db/pool";

let auth;

export function getAuth() {
  const configuration = getBackendConfiguration();
  if (!configuration.ready) {
    throw new Error(`Backend setup required: ${configuration.missing.join(", ")}`);
  }

  if (!auth) {
    auth = createAuth(getPool());
  }

  return auth;
}