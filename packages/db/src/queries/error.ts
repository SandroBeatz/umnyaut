/** An unexpected database failure; route handlers turn it into a 500 without the details. */
export class DbError extends Error {
  constructor(
    operation: string,
    readonly code: string | undefined,
    message: string,
  ) {
    super(`${operation}: ${message}`);
    this.name = "DbError";
  }
}

export function fail(operation: string, error: { code?: string; message: string }): never {
  throw new DbError(operation, error.code, error.message);
}
