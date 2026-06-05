async function publish() {
  const host = 'localhost';
  const port = 4222;

  const body = JSON.stringify({ name: 'plane.work-item.create', payload: { name: 'from-nats', stateId: 'f87b7284-92d4-4ce9-897f-6707a2258367' } });
  const len = Buffer.byteLength(body);

  await new Promise<void>(async (resolve, reject) => {
    try {
      await Bun.connect({
        hostname: host,
        port: port,
        socket: {
          open: (socket) => {
            try {
              socket.write('CONNECT {"verbose":false,"pedantic":false}\r\n');
              socket.write(`PUB aipm.commands ${len}\r\n${body}\r\n`);
              setTimeout(() => {
                try {
                  socket.end();
                  resolve();
                } catch (e) {
                  reject(e);
                }
              }, 200);
            } catch (e) {
              reject(e);
            }
          },
          data: () => {},
          close: () => {},
          error: (_s, err) => reject(err),
        },
      });
    } catch (e) {
      reject(e);
    }
  });
  console.log('published');
}

publish().catch((e) => { console.error(e); process.exitCode = 1; });
