import { handler } from "./build/handler.js";
import express from "express";
import { readFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";

const originURL = new URL(process.env.ORIGIN);

let hasSSL = false;
let key;
let cert;
if (process.env.HTTPS_PORT_NUMBER && process.env.HTTPS_CERT_PATH && process.env.HTTPS_KEY_PATH) {
  hasSSL = true;

  key = readFileSync(process.env.HTTPS_KEY_PATH);
  cert = readFileSync(process.env.HTTPS_CERT_PATH);
}

const app = express();

const port = Number(process.env.PORT_NUMBER);

if (hasSSL) {
  const httpsServer = https.createServer({ key, cert }, app);

  httpsServer.listen(port, function () {
    console.log("HTTPS Server is running on: https://%s:%s", originURL.hostname, port);
  });
} else {
  const httpServer = http.createServer(app);

  httpServer.listen(port, function () {
    console.log("HTTP Server is running on: http://%s:%s", originURL.hostname, port);
  });
}

app.use((req, res, next) => {
  const d = new Date();
  console.log(`(${d.toLocaleString()}) ${req.socket.remoteAddress} [${req.method}] ${req.url}`);
  next();
});

app.get("/where-https", (req, res) => {
  res.send(sslport);
});

app.use(handler);
