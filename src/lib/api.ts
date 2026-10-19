import type {
  Category,
  RequirementPayload,
  RequirementRecord,
} from "@/types/requirement";
import type { FieldIssue } from "@/lib/validation";

/**
 * API utility layer.
 *
 * Points at `NEXT_PUBLIC_API_URL` when provided (e.g. the standalone
 * Express + MongoDB backend: http://localhost:5000/api), otherwise falls
 * back to the embedded API shipped with this app (same contract, relative
 * path). Both backends implement identical response shapes.
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/+$/, "");

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
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiRequestError(
      "Could not reach the requirements API. Please check your connection and try again.",
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
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    if (!res.ok) return false;
    const body = (await res.json()) as { success?: boolean };
    return body.success !== false;
  } catch {
    return false;
  }
}
