import "server-only";

import { getEventAnalytics } from "@/lib/analytics/server";
export { organizerAssistantTools } from "@/lib/ai/tool-definitions.mjs";

export async function getEventAnalyticsTool({ organizationId, eventId }) {
  const result = await getEventAnalytics(eventId, organizationId);
  if (result.error) {
    const error = new Error(result.error);
    error.status = result.status;
    error.code = result.status === 404 ? "EVENT_NOT_FOUND" : "AI_TOOL_FORBIDDEN";
    throw error;
  }
  return {
    tool: "get_event_analytics",
    data: {
      event: result.event,
      metrics: result.metrics,
      registrationsByDay: result.registrationsByDay,
      checkinsByDay: result.checkinsByDay,
      ticketsByType: result.ticketsByType,
    },
  };
}
