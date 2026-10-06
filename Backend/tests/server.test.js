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

test("GET / returns service status", async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());
  await once(server, "listening");

  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "eduinsight-api",
  });
});

test("OPTIONS preflight allows the local frontend origin", async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());
  await once(server, "listening");

  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/login`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:5173",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:5173");
});

test("OPTIONS preflight accepts a deployed Vercel origin even when CLIENT_URL has a trailing slash", async (t) => {
  const previousClientUrl = process.env.CLIENT_URL;
  process.env.CLIENT_URL = "https://edu-insight-roua-olive.vercel.app/";
  delete require.cache[require.resolve("../server")];
  const freshApp = require("../server");
  const server = freshApp.listen(0);
  t.after(() => {
    process.env.CLIENT_URL = previousClientUrl;
    delete require.cache[require.resolve("../server")];
    server.close();
  });
  await once(server, "listening");

  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/login`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://edu-insight-roua-olive.vercel.app",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://edu-insight-roua-olive.vercel.app");
});
