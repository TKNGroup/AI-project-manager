import { Logger } from "@common/logger";
import { type NodeEnv } from "@common/shared";

import { envConfig } from "./config";
import { PlaneDispatcher } from "./cqrs/plane-dispatcher";
import { NatsEventBus } from "./events/event-bus";
import { startHttpServer } from "./http/server";
import { PlaneClient } from "./plane/plane-client";

const NODE_ENV: NodeEnv =
  process.env["NODE_ENV"] === undefined
    ? "development"
    : (process.env["NODE_ENV"] as NodeEnv);

const logger = Logger.new(NODE_ENV, envConfig.logger.level, "aipm/plane-agent");

logger.info("starting");

const eventBus = await NatsEventBus.connect(logger, envConfig.nats.url);
const planeClient = new PlaneClient(envConfig.plane);
const dispatcher = new PlaneDispatcher(planeClient, eventBus, logger);
const server = startHttpServer(
  { host: envConfig.host, port: envConfig.port },
  dispatcher,
  eventBus,
);

const webhookUrl = envConfig.plane.webhookUrl ?? buildWebhookUrl();
try {
  const webhook = await planeClient.registerWebhook(webhookUrl);
  logger.info({ webhook, webhookUrl }, "Plane webhook registered");
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  // If Plane returns 401 (insufficient API permissions), skip automatic registration.
  if (msg.includes("401") || msg.includes("Authentication credentials were not provided")) {
    logger.info({ err: e, webhookUrl }, "skip webhook registration — insufficient Plane API permissions");
  } else {
    logger.warn({ err: e, webhookUrl }, "failed to register Plane webhook");
  }
}

// subscribe to commands coming from NATS so this agent can process forwarded commands
await eventBus.subscribe("aipm.commands", async (payload) => {
  try {
    // payload expected to be a command shape
    await dispatcher.dispatchCommand(payload as any);
  } catch (e) {
    logger.error(e, "failed to dispatch command from NATS");
  }
});

logger.info(
  { host: server.hostname, port: server.port },
  "plane agent http server started",
);

process.on("unhandledRejection", (rejection) => {
  logger.fatal(rejection, "unhandled rejection");
});

process.on("uncaughtException", (exception) => {
  logger.fatal(exception, "uncaught exception");
});

process.on("SIGINT", () => {
  eventBus.close();
  server.stop();
  process.exit(0);
});

function buildWebhookUrl(): string {
  const host = envConfig.host === "0.0.0.0" ? "localhost" : envConfig.host;
  const protocol = host.includes(":") ? "http" : "http";
  return `${protocol}://${host}:${envConfig.port}/plane/webhook`;
}
