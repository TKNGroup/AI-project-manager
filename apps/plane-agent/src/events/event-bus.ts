import { Logger } from "@common/logger";

type NatsSocket = {
  write(data: string | Uint8Array): void;
  end(): void;
};

type NatsSocketData = string | Uint8Array | ArrayBuffer | Buffer;
type NatsHandler = (payload: unknown, subject: string) => Promise<void>;

export class NatsEventBus {
  private socket?: NatsSocket;
  private readonly subscriptions = new Map<string, NatsHandler>();
  private nextSid = 1;
  private buffer = "";

  private constructor(
    private readonly logger: Logger,
    private readonly url?: string,
  ) {}

  public static async connect(
    logger: Logger,
    url?: string,
  ): Promise<NatsEventBus> {
    const bus = new NatsEventBus(logger, url);

    await bus.connectSocket();

    return bus;
  }

  public async publish(subject: string, payload: unknown): Promise<void> {
    if (this.socket === undefined) {
      this.logger.debug({ subject }, "nats disabled, skip publish");

      return;
    }

    const body = JSON.stringify(payload);
    this.socket.write(`PUB ${subject} ${Buffer.byteLength(body)}\r\n${body}\r\n`);
  }

  public async subscribe(subject: string, handler: NatsHandler): Promise<void> {
    if (this.socket === undefined) {
      this.logger.debug({ subject }, "nats disabled, skip subscribe");

      return;
    }

    const sid = String(this.nextSid++);
    this.subscriptions.set(sid, handler);
    this.socket.write(`SUB ${subject} ${sid}\r\n`);
  }

  public close(): void {
    this.socket?.end();
  }

  private async connectSocket(): Promise<void> {
    if (this.url === undefined) {
      this.logger.warn("NATS_URL is not configured, event bus disabled");

      return;
    }

    const parsedUrl = new URL(this.url);
    const hostname = parsedUrl.hostname;
    const port = Number(parsedUrl.port === "" ? "4222" : parsedUrl.port);

    try {
      this.socket = (await Bun.connect({
        hostname: hostname,
        port: port,
        socket: {
          open: (socket: NatsSocket) => {
            socket.write('CONNECT {"verbose":false,"pedantic":false}\r\n');
            socket.write("PING\r\n");
            this.logger.info({ url: this.url }, "connected to nats");
          },
          data: (_socket: NatsSocket, data: NatsSocketData) => {
            const buffer =
              typeof data === "string"
                ? Buffer.from(data)
                : data instanceof ArrayBuffer
                ? Buffer.from(new Uint8Array(data))
                : Buffer.from(data);

            this.handleData(buffer.toString("utf8")).catch((error) => {
              this.logger.error(error, "failed to process nats message");
            });
          },
          close: () => {
            this.logger.warn("nats connection closed");
          },
          error: (_socket: NatsSocket, error: Error) => {
            this.logger.error(error, "nats connection error");
          },
        },
      })) as NatsSocket;
    } catch (error) {
      this.logger.warn(error, "failed to connect to nats, event bus disabled");
    }
  }

  private async handleData(chunk: string): Promise<void> {
    this.buffer += chunk;

    while (true) {
      const lineEnd = this.buffer.indexOf("\r\n");

      if (lineEnd === -1) {
        return;
      }

      const line = this.buffer.slice(0, lineEnd);

      if (line.startsWith("MSG ")) {
        const parts = line.split(" ");
        const subject = parts[1];
        const sid = parts[2];
        const sizeRaw = parts[3];

        if (
          subject === undefined ||
          sid === undefined ||
          sizeRaw === undefined
        ) {
          this.buffer = this.buffer.slice(lineEnd + 2);
          continue;
        }

        const size = Number(sizeRaw);
        const messageEnd = lineEnd + 2 + size;

        if (this.buffer.length < messageEnd + 2) {
          return;
        }

        const rawPayload = this.buffer.slice(lineEnd + 2, messageEnd);
        this.buffer = this.buffer.slice(messageEnd + 2);

        const handler = this.subscriptions.get(sid);

        if (handler === undefined) {
          continue;
        }

        await handler(JSON.parse(rawPayload) as unknown, subject);
        continue;
      }

      if (line === "PING") {
        this.socket?.write("PONG\r\n");
      }

      this.buffer = this.buffer.slice(lineEnd + 2);
    }
  }
}
