const http = require("node:http");
const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify({ ok: true, service: "nginx-demo", path: req.url }));
});
server.listen(8000, "0.0.0.0");
process.on("SIGTERM", () => server.close());
