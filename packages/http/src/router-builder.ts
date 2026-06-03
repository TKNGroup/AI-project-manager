import { HttpStatus } from "./http-status";

import type { HTTPMethod } from "./http-method";
import type { Route, RouterHandler } from "./route";
import type * as Bun from "bun";

type InternalRoute = {
  methods: HTTPMethod[];
  path: string;
  regex: RegExp;
  keys: string[];
  handler: RouterHandler;
};

type AfterHandleHandler = (
  request: Bun.BunRequest,
  response: Response,
) => Promise<Response>;

type BeforeHandleHandler = (
  request: Bun.BunRequest,
) => Promise<Response | null>;

export class RouterBuilder {
  private routes: InternalRoute[] = [];
  private afterHandleHandlers: AfterHandleHandler[] = [];
  private beforeHandleHandlers: BeforeHandleHandler[] = [];

  public add<Path extends string>(router: Route<Path>): this {
    const { methods, path, handler } = router;
    const { regex, keys } = this.createPathMatcher(path);

    this.routes.push({
      methods: methods,
      path: path,
      regex: regex,
      keys: keys,
      handler: handler as RouterHandler,
    });

    return this;
  }

  public beforeHandle(handler: BeforeHandleHandler): void {
    this.beforeHandleHandlers.push(handler);
  }

  public afterHandle(handler: AfterHandleHandler): void {
    this.afterHandleHandlers.push(handler);
  }

  public build(prefix?: string): Record<string, RouterHandler> {
    const groupedRoutes = new Map<string, InternalRoute[]>();

    for (const route of this.routes) {
      const routeGroup = groupedRoutes.get(route.path);

      if (routeGroup === undefined) {
        groupedRoutes.set(route.path, [route]);
        continue;
      }

      routeGroup.push(route);
    }

    const routes: Record<string, RouterHandler> = {};

    for (const [path, group] of groupedRoutes.entries()) {
      const handler: RouterHandler = async (request) => {
        for (const handler of this.beforeHandleHandlers) {
          const response = await handler(request);

          if (response !== null) {
            return response;
          }
        }

        for (const route of group) {
          if (!route.methods.includes(request.method as HTTPMethod)) {
            continue;
          }

          try {
            let response = await route.handler(request);

            for (const handler of this.afterHandleHandlers) {
              response = await handler(request, response);
            }

            return response;
          } catch {
            return new Response(null, {
              status: HttpStatus.INTERNAL_SERVER_ERROR,
            });
          }
        }

        return new Response(null, { status: HttpStatus.METHOD_NOT_ALLOWED });
      };

      const routePath = this.makePath(path, prefix);
      const altRoutePath = routePath.endsWith("/")
        ? `${routePath.substring(0, routePath.length - 1)}`
        : `${routePath}/`;

      routes[routePath] = handler;
      routes[altRoutePath] = handler;
    }

    return routes;
  }

  private createPathMatcher(path: string): { regex: RegExp; keys: string[] } {
    const keys: string[] = [];

    const regex = new RegExp(
      "^" +
        path.replace(/\/:([^/]+)/g, (_, key) => {
          keys.push(key);

          return "/([^/]+)";
        }) +
        "$",
    );

    return { regex, keys };
  }

  private makePath(originalPath: string, prefix?: string): string {
    if (prefix === undefined) {
      return originalPath;
    }

    const p1 = prefix.replace(/\/+$/, "");
    const p2 = originalPath.replace(/^\/+/, "");

    return "/" + [p1, p2].join("/");
  }
}
