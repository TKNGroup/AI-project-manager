type ApiResultOk<T> = [T] extends [never]
  ? { ok: true }
  : { ok: true; value: T };

type ApiResultError<E> = [E] extends [never]
  ? { ok: false }
  : { ok: false; error: E };

export type ApiResult<T, E> = ApiResultOk<T> | ApiResultError<E>;
