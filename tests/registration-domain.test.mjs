import test from "node:test";
import assert from "node:assert/strict";
import { createTicketCredentials, registrationSchema } from "../lib/registrations/domain.mjs";

test("registration requires valid identity details and terms acceptance", () => {
  assert.equal(registrationSchema.safeParse({ fullName: "A", email: "bad", acceptedTerms: false }).success, false);
  assert.equal(registrationSchema.safeParse({ fullName: "Tasin Islam", email: "tasin@example.com", acceptedTerms: true }).success, true);
});

test("ticket credentials contain an opaque token and unique check-in values", () => {
  const first = createTicketCredentials();
  const second = createTicketCredentials();
  assert.notEqual(first.token, second.token);
  assert.notEqual(first.tokenHash, second.tokenHash);
  assert.match(first.ticketNumber, /^UT-[A-F0-9]+$/);
  assert.equal(first.tokenHash.length, 64);
});