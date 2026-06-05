import { Logger } from "@common/logger";

type NatsSocket = {
  write(data: string | Uint8Array): void;
  end(): void;
};

type NatsSocketData = string | Uint8Array | ArrayBuffer | Buffer;
type NatsHandler = (payload: unknown, subject: string) => Promise<void>;

export class NatsEventListener {
  private socket?: NatsSocket;
  private readonly subscriptions = new Map<string, NatsHandler>();
  private nextSid = 1;
  private buffer = "";

  public constructor(
    private readonly logger: Logger,
    private readonly url?: string,
  ) {}

  public async connect(): Promise<void> {
    if (this.url === undefined) {
      this.logger.warn("NATS_URL is not configured, event listener disabled");

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
            this.handleData(Buffer.from(data).toString("utf8")).catch(
              (error) => {
                this.logger.error(error, "failed to process nats event");
              },
            );
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
      this.logger.warn(
        error,
        "failed to connect to nats, event listener disabled",
      );
    }
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
