export interface FieldError {
  field: string;
  message: string;
}

/**
 * Operational error with an HTTP status. Safe to expose: only the
 * `message` (and optional per-field errors) reach the client.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors?: FieldError[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}
