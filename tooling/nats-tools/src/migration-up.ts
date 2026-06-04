import {
  jetstreamManager,
  RetentionPolicy,
  StorageType,
} from "@nats-io/jetstream";
import { connect } from "@nats-io/transport-node";

try {
  console.log("Migration start");

  const nc = await connect({
    servers: `nats://${process.env["NATS_HOST"]}:${process.env["NATS_PORT"]}`,
  });
  const jsm = await jetstreamManager(nc);

  await jsm.streams.add({
    name: "RAW_DATA",
    subjects: ["raw-data.messages"],
    storage: StorageType.Memory,
    retention: RetentionPolicy.Limits,
  });

  console.log("Migration up done");

  await nc.close();

  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
