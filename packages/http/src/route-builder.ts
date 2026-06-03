import { type HTTPMethod } from "./http-method";
import { type Route } from "./route";

export type RequestContext = Record<string, unknown>;

type MiddlewareNextCallback<OutCtx = RequestContext> = [OutCtx] extends [never]
  ? () => void
  : (context: OutCtx) => Promise<void>;

export type Middleware<
  InCtx extends RequestContext,
  OutCtx extends RequestContext | never = never,
  RoutePath extends string = string,
> = (
  context: InCtx,
  request: Bun.BunRequest<RoutePath>,
  next: MiddlewareNextCallback<OutCtx>,
) => Promise<Response | void>;

export type Controller<
  Ctx extends RequestContext,
  RoutePath extends string = string,
> = (context: Ctx, request: Bun.BunRequest<RoutePath>) => Promise<Response>;

interface RouteBuilderBeforeBuild<
  RoutePath extends string,
  InitialCtx extends RequestContext | undefined = undefined,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  AccCtx extends RequestContext = {},
> {
  middleware<
    InCtxT extends RequestContext,
    NewContextT extends RequestContext,
    RoutePathT extends string,
  >(
    middleware: Middleware<
      InitialCtx extends undefined ? InCtxT : AccCtx,
      NewContextT,
      RoutePathT
    >,
  ): RouteBuilderBeforeBuild<
    RoutePath,
    InitialCtx extends undefined ? InCtxT : InitialCtx,
    InitialCtx extends undefined ? InCtxT & NewContextT : AccCtx & NewContextT
  >;

  controller<CtxT extends RequestContext>(
    controller: Controller<
      InitialCtx extends undefined ? CtxT : AccCtx,
      RoutePath
    >,
  ): RouteBuilderAfterController<
    RoutePath,
    InitialCtx extends undefined ? CtxT : InitialCtx
  >;
}

interface RouteBuilderAfterController<
  RoutePath extends string,
  InitialCtx extends RequestContext | undefined = undefined,
> {
  build(context: InitialCtx): Route<RoutePath>;
}

export class RouteBuilder<
  RoutePath extends string,
  InitialCtx extends RequestContext | undefined = undefined,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  AccCtx extends RequestContext = {},
> implements RouteBuilderBeforeBuild<RoutePath, InitialCtx, AccCtx> {
  private readonly path: RoutePath;
  private readonly middlewares: Middleware<
    RequestContext,
    RequestContext,
    RoutePath
  >[] = [];
  private controllerFn?: Controller<AccCtx, RoutePath>;
  private hasController = false;
  private method: HTTPMethod | HTTPMethod[];

  public constructor(path: RoutePath, method: HTTPMethod | HTTPMethod[]) {
    this.path = path;
    this.method = method;
  }

  public middleware<
    InCtxT extends RequestContext,
    NewContextT extends RequestContext,
    RoutePathT extends string,
  >(
    middleware: Middleware<
      InitialCtx extends undefined ? InCtxT : AccCtx,
      NewContextT,
      RoutePathT
    >,
  ): RouteBuilderBeforeBuild<
    RoutePath,
    InitialCtx extends undefined ? InCtxT : InitialCtx,
    InitialCtx extends undefined ? InCtxT & NewContextT : AccCtx & NewContextT
  > {
    if (this.hasController) {
      throw new Error("Middleware cannot be added after controller");
    }

    this.middlewares.push(
      middleware as unknown as Middleware<
        RequestContext,
        RequestContext,
        RoutePath
      >,
    );

    return this as unknown as RouteBuilderBeforeBuild<
      RoutePath,
      InitialCtx extends undefined ? InCtxT : InitialCtx,
      InitialCtx extends undefined ? InCtxT & NewContextT : AccCtx & NewContextT
    >;
  }

  public controller<CtxT extends RequestContext>(
    controller: Controller<
      InitialCtx extends undefined ? CtxT : AccCtx,
      RoutePath
    >,
  ): RouteBuilderAfterController<
    RoutePath,
    InitialCtx extends undefined ? CtxT : InitialCtx
  > {
    this.controllerFn = controller as unknown as Controller<AccCtx, RoutePath>;
    this.hasController = true;

    return this as unknown as RouteBuilder<
      RoutePath,
      InitialCtx extends undefined ? CtxT : InitialCtx,
      InitialCtx extends undefined ? CtxT : AccCtx & CtxT
    >;
  }

  public build(context: InitialCtx): Route<RoutePath> {
    const routeHandler = async (
      request: Bun.BunRequest<RoutePath>,
    ): Promise<Response> => {
      try {
        const controllerFn = this.controllerFn;
        const middlewares = this.middlewares;

        if (!controllerFn) {
          throw new Error("Controller must be defined before building");
        }

        const mutableContext: RequestContext = { ...context };

        const middlewareResult = await this.runMiddleware(
          0,
          middlewares,
          controllerFn,
          mutableContext,
          request,
        );

        if (middlewareResult instanceof Response) {
          return middlewareResult;
        }

        return new Response("Server No Respond", { status: 500 });
      } catch {
        return new Response("Internal Server Error", { status: 500 });
      }
    };

    return {
      path: this.path,
      methods: typeof this.method === "string" ? [this.method] : this.method,
      handler: routeHandler,
    };
  }

  private async runMiddleware(
    index: number,
    middlewares: Middleware<RequestContext, RequestContext, RoutePath>[],
    controllerFn: Controller<AccCtx, RoutePath>,
    mutableContext: RequestContext,
    request: Bun.BunRequest<RoutePath>,
  ): Promise<Response | void> {
    if (index >= middlewares.length) {
      try {
        return await controllerFn(mutableContext as unknown as AccCtx, request);
      } catch (error) {
        return new Response("Internal Server Error", { status: 500 });
      }
    }

    const middleware = middlewares[index]!;

    const resolvers = Promise.withResolvers<void | Response>();

    let middlewareResultPromise: Promise<Response | void>;

    try {
      middlewareResultPromise = Promise.resolve(
        middleware(mutableContext, request, async (ctx) => {
          Object.assign(mutableContext, ctx);

          const result = await this.runMiddleware(
            index + 1,
            middlewares,
            controllerFn,
            mutableContext,
            request,
          );

          resolvers.resolve(result);
        }),
      );
    } catch (error) {
      return new Response("Bad Request", { status: 400 });
    }

    const result = await Promise.race([
      middlewareResultPromise,
      resolvers.promise,
    ]);

    if (result instanceof Response) {
      return result;
    }

    return resolvers.promise;
  }
}
