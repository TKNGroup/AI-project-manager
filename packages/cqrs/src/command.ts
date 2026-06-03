import { type CqrsMeta } from "./meta";

export interface Command<
  Name extends string,
  Payload = unknown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Result = unknown,
> {
  name: Name;
  payload: Payload;
  meta: CqrsMeta;
}

export const Command = {
  new: <Name extends string, Payload = unknown, Result = unknown>(
    name: Name,
    payload: Payload,
    meta: CqrsMeta,
  ): Command<Name, Payload, Result> => {
    return {
      name: name,
      payload: payload,
      meta: meta,
    };
  },
};

export type InferCommandName<C> =
  C extends Command<infer Name, unknown, unknown> ? Name : never;

export type InferCommandPayload<C> =
  C extends Command<string, infer Payload, unknown> ? Payload : never;

export type InferCommandResult<C> =
  C extends Command<string, unknown, infer Result> ? Result : never;
