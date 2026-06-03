import { type ApiErrorMap } from "./api-error-map";

export type ApiError<C extends keyof ApiErrorMap> = {
  [K in C]: ApiErrorMap[K] extends void
    ? { code: K }
    : { code: K; data: ApiErrorMap[K] };
}[C];
