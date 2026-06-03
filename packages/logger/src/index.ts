import { type NodeEnv, switchSafe, UUIDv7 } from "@common/shared";
import pino from "pino";

export class Logger {
  public static readonly traceIdField = "traceId";

  private readonly pino: pino.Logger;

  private constructor(pino: pino.Logger) {
    this.pino = pino;
  }

  public static new(nodeEnv: NodeEnv, level: string, appName: string): Logger {
    let pinoLogger: pino.Logger;

    switch (nodeEnv) {
      case "production":
      case "test": {
        process.env["NO_COLOR"] = "true";

        pinoLogger = pino({
          level: level,
        });

        break;
      }
      case "development": {
        pinoLogger = pino({
          transport: {
            target: "pino-pretty",
            options: {
              ignore: "pid,hostname",
            },
          },
          level: level,
        });

        break;
      }
      default: {
        switchSafe(nodeEnv);
      }
    }

    return new Logger(pinoLogger).child({ appName: appName });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public child(bindings: Record<string, any>): Logger {
    return new Logger(this.pino.child(bindings));
  }

  public stack(fnName: string): Logger {
    const existingStack: string[] = this.pino.bindings()["stack"] ?? [];

    return this.child({ stack: [...existingStack, fnName] });
  }

  public fatal(obj: unknown, msg: string): void;
  public fatal(msg: string): void;
  public fatal(objOrMsg: unknown | string, msg?: string): void {
    this.pino.fatal(objOrMsg, msg);
  }

  public error(obj: unknown, msg: string): void;
  public error(msg: string): void;
  public error(objOrMsg: unknown | string, msg?: string): void {
    this.pino.error(objOrMsg, msg);
  }

  public warn(obj: unknown, msg: string): void;
  public warn(msg: string): void;
  public warn(objOrMsg: unknown | string, msg?: string): void {
    this.pino.warn(objOrMsg, msg);
  }

  public info(obj: unknown, msg: string): void;
  public info(msg: string): void;
  public info(objOrMsg: unknown | string, msg?: string): void {
    this.pino.info(objOrMsg, msg);
  }

  public debug(obj: unknown, msg: string): void;
  public debug(msg: string): void;
  public debug(objOrMsg: unknown | string, msg?: string): void {
    this.pino.debug(objOrMsg, msg);
  }

  public trace(obj: unknown, msg: string): void;
  public trace(msg: string): void;
  public trace(objOrMsg: unknown | string, msg?: string): void {
    this.pino.trace(objOrMsg, msg);
  }

  public unexpectedError(error: unknown): void {
    this.pino.error(
      { unexpectedError: error },
      `unexpected error: ${error instanceof Error ? error.message : ":)"}`,
    );
  }

  public getTraceId(): string {
    const traceId = this.pino.bindings()[Logger.traceIdField];

    if (typeof traceId === "string") {
      return traceId;
    }

    const tempTraceId = UUIDv7.new();

    this.warn({ tempTraceId: tempTraceId }, `trace id no exists in bindings`);

    return tempTraceId;
  }

  public addTraceId(traceId?: string): Logger {
    const value = traceId === undefined ? UUIDv7.new() : traceId;

    return this.child({ [Logger.traceIdField]: value });
  }
}
