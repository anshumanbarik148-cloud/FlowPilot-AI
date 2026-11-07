import { ApiError } from "@/lib/api";

/** Friendly message from any thrown error — ApiError bodies carry FastAPI {detail}. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const detail = (err.body as { detail?: unknown } | null)?.detail;
    if (typeof detail === "string" && detail.length > 0) return detail;
    if (err.status === 503) return "The AI service is unavailable right now — please try again shortly.";
    return "Something went wrong talking to the server. Please try again.";
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}
