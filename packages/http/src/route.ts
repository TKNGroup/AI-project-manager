import { type HTTPMethod } from "./http-method";

import type * as Bun from "bun";

export type RouterHandler<Path extends string = string> = (
  request: Bun.BunRequest<Path>,
) => Promise<Response>;

export interface Route<Path extends string = string> {
  methods: HTTPMethod[];
  path: Path;
  handler: RouterHandler<Path>;
}
