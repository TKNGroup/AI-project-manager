import { type ApiError } from "./api-error";
import { type ApiErrorMap } from "./api-error-map";

export class ApiErrorException<C extends keyof ApiErrorMap> extends Error {
  public readonly details: ApiError<C>;

  constructor(error: ApiError<C>) {
    super(`API Error: ${error.code}`);

    this.details = error;

    Object.setPrototypeOf(this, ApiErrorException.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiErrorException);
    }
  }
}
