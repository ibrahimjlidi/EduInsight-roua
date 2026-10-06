const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const app = require("../server");

test("GET /health returns service status", async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());
  await once(server, "listening");

  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "eduinsight-api",
  });
});
