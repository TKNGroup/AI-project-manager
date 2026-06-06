import { connect, type NatsConnection } from "@nats-io/transport-node";

import type { Logger } from "@common/logger";

export async function bootstrapNatsConnection(
  host: string,
  port: number,
  propsLogger: Logger,
): Promise<NatsConnection> {
  const logger = propsLogger.stack("bootstrapNatsConnection");

  try {
    logger.debug({ host: host, port: port }, "estabilish nats connection");

    const natsConnection = await connect({
      servers: `nats://${host}:${port}`,
    });

    process.once("SIGINT", () => {
      void natsConnection.close();
    });

    process.once("SIGTERM", () => {
      void natsConnection.close();
    });

    logger.info("nats connection estabilished");

    return natsConnection;
  } catch (error) {
    logger.unexpectedError(error);

    logger.fatal("cannot connect to nats");

    process.exit(1);
  }
}
