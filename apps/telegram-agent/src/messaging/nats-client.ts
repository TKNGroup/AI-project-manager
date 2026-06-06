import { connect, type NatsConnection } from "@nats-io/transport-node";

import type { envConfigSchema } from "../config/env-config.schema";
import type { Logger } from "@common/logger";
import type z from "zod";

type EnvConfig = z.infer<typeof envConfigSchema>;

export async function connectNats(
  config: EnvConfig,
  logger: Logger,
): Promise<NatsConnection> {
  const nc = await connect({
    servers: `nats://${config.nats.host}:${config.nats.port}`,
  });

  logger.info(
    { host: config.nats.host, port: config.nats.port },
    "connected to nats",
  );

  return nc;
}
