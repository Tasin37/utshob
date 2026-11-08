import "server-only";

import {
  completeSuccessfulPayment,
  createOrder,
  failPayment,
  getOrder,
  listOrdersByEvent,
  updateOrderStatus,
} from "./domain.mjs";

export async function createPaymentOrder(input, userId = null) {
  return createOrder(input, userId);
}

export async function getPaymentOrder(orderId, userId = null) {
  return getOrder(orderId, userId);
}

export async function updatePaymentOrderStatus(orderId, status, providerReference = null) {
  return updateOrderStatus(orderId, status, providerReference);
}

export async function completePaymentOrder(input) {
  return completeSuccessfulPayment(input);
}

export async function confirmManualPayment(input) {
  return completeSuccessfulPayment(input);
}

export async function failPaymentOrder(orderId, providerReference = null) {
  return failPayment(orderId, providerReference);
}

export async function listEventOrders(eventId, organizationId) {
  return listOrdersByEvent(eventId, organizationId);
}
