import { handler } from "./build/handler.js";
import express from "express";
import { readFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";

let hasSSL = false;
let key;
let cert;
if (process.env.HTTPS_PORT_NUMBER && process.env.HTTPS_CERT_PATH && process.env.HTTPS_KEY_PATH) {
  hasSSL = true;

  key = readFileSync(process.env.HTTPS_KEY_PATH);
  cert = readFileSync(process.env.HTTPS_CERT_PATH);
}

const app = express();

const host = process.env.HOST_NAME;

if (hasSSL) {
  const httpsServer = https.createServer({ key, cert }, app);

  httpsServer.listen(3000, host, function () {
    console.log("HTTPS Server is running on: https://%s:3000", host);
  });
} else {
  const httpServer = http.createServer(app);

  httpServer.listen(3000, host, function () {
    console.log("HTTP Server is running on: http://%s:3000", host);
  });
}

app.use((req, res, next) => {
  const d = new Date();
  console.log(`(${d.toLocaleString()}) ${req.socket.remoteAddress} [${req.method}] ${req.url}`);
  next();
});

app.use(handler);
