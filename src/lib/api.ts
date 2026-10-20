import type {
  Category,
  RequirementPayload,
  RequirementRecord,
} from "@/types/requirement";
import type { FieldIssue } from "@/lib/validation";

/**
 * API utility layer.
 *
 * Always talks to the standalone Express + MongoDB backend configured with
 * `NEXT_PUBLIC_API_URL` (e.g. http://localhost:5000/api). There is no embedded
 * Next.js API route in this app.
 */
const CONFIGURED_API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(
  /\/+$/,
  "",
);
const API_BASE = CONFIGURED_API_BASE || "/api";

const REQUEST_TIMEOUT_MS = 15_000;
const HEALTH_TIMEOUT_MS = 5_000;

function timeoutSignal(ms: number): AbortSignal | undefined {
  return typeof AbortSignal !== "undefined" &&
    typeof AbortSignal.timeout === "function"
    ? AbortSignal.timeout(ms)
    : undefined;
}

export type ApiErrorKind = "validation" | "network" | "server" | "notFound";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: FieldIssue[] = [],
    public readonly kind: ApiErrorKind = "server",
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

interface ApiResponse {
  success?: boolean;
  message?: string;
  errors?: FieldIssue[];
  data?: unknown;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!CONFIGURED_API_BASE) {
    throw new ApiRequestError(
      "The requirements API URL is not configured. Set NEXT_PUBLIC_API_URL to your Express backend (for example http://localhost:5000/api).",
      0,
      [],
      "network",
    );
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      signal: init?.signal ?? timeoutSignal(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut =
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError");
    throw new ApiRequestError(
      timedOut
        ? "The requirements API took too long to respond. Please try again."
        : "Could not reach the requirements API. Please check your connection and try again.",
      0,
      [],
      "network",
    );
  }

  let body: ApiResponse | null = null;
  try {
    body = (await res.json()) as ApiResponse;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const kind: ApiErrorKind =
      res.status === 404
        ? "notFound"
        : res.status === 400 || res.status === 422
          ? "validation"
          : "server";
    throw new ApiRequestError(
      body?.message ?? `Request failed with status ${res.status}`,
      res.status,
      Array.isArray(body?.errors) ? body!.errors : [],
      kind,
    );
  }

  return body as T;
}

export interface CreateRequirementData {
  id: string;
  category: Category;
  status: string;
}

export const requirementsApi = {
  create(payload: RequirementPayload) {
    return request<{ success: true; message: string; data: CreateRequirementData }>(
      "/requirements",
      { method: "POST", body: JSON.stringify(payload) },
    );
  },
  getById(id: string) {
    return request<{ success: true; data: RequirementRecord }>(
      `/requirements/${encodeURIComponent(id)}`,
    );
  },
};

/** Non-throwing health probe used by the sidebar status widget. */
export async function checkApiHealth(): Promise<boolean> {
  if (!CONFIGURED_API_BASE) return false;
  try {
    const res = await fetch(`${API_BASE}/health`, {
      cache: "no-store",
      signal: timeoutSignal(HEALTH_TIMEOUT_MS),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { success?: boolean };
    return body.success !== false;
  } catch {
    return false;
  }
}
