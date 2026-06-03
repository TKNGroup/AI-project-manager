import { type InferQueryResult, type Query } from "./query";

export type QueryHandler<QueryT extends Query<string, unknown, unknown>> = (
  query: QueryT,
) => Promise<InferQueryResult<QueryT>>;
