import { type CqrsMeta } from "./meta";

export interface Query<
  Name extends string,
  Payload = unknown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Result = unknown,
> {
  name: Name;
  payload: Payload;
  meta: CqrsMeta;
}

export const Query = {
  new: <Name extends string, Payload = unknown, Result = unknown>(
    name: Name,
    payload: Payload,
    meta: CqrsMeta,
  ): Query<Name, Payload, Result> => {
    return {
      name: name,
      payload: payload,
      meta: meta,
    };
  },
};

export type InferQueryName<C> =
  C extends Query<infer Name, unknown, unknown> ? Name : never;

export type InferQueryPayload<C> =
  C extends Query<string, infer Payload, unknown> ? Payload : never;

export type InferQueryResult<C> =
  C extends Query<string, unknown, infer Result> ? Result : never;
