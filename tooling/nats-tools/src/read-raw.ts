import { jetstreamManager } from "@nats-io/jetstream";
import { connect } from "@nats-io/transport-node";

async function main() {
  try {
    const nc = await connect({ servers: `nats://localhost:4222` });
    const jsm = await jetstreamManager(nc);

    const info = await jsm.streams.info("RAW_DATA");
    console.log("stream info:", info.config ? { name: info.config.name, last_seq: info.state.last_seq } : info);

    const last = info.state.last_seq;
    if (!last || last === 0) {
      console.log("no messages in stream");
      await nc.close();
      return;
    }

    const msg = await jsm.streams.getMessage("RAW_DATA", { seq: last });
    console.log("message:", msg);

    await nc.close();
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
}

main();
