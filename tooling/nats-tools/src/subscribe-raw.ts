import { connect } from "nats";

(async () => {
  const nc = await connect({ servers: "nats://localhost:4222" });
  console.log("connected to nats");
  const sub = nc.subscribe("raw-data.messages");
  for await (const m of sub) {
    try {
      const text = typeof m.data === "string" ? m.data : new TextDecoder().decode(m.data);
      console.log("received:", JSON.parse(text));
    } catch (e) {
      console.log("received raw:", m.data.toString());
    }
  }
})();
