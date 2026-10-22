// Optional single-container hosting helpers:
//  - STATIC_DIR: serve the built dashboard (SPA) from Express
//  - LEARNCHAIN_INTERNAL: reverse-proxy /learnchain/* to the LearnChain Flask app
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import express, { type Express } from "express";

export function mountHosting(app: Express) {
  const target = process.env.LEARNCHAIN_INTERNAL;
  if (target) {
    const t = new URL(target);
    app.use("/learnchain", (req, res) => {
      if (req.originalUrl === "/learnchain") { res.redirect("/learnchain/"); return; }
      const p = http.request({ host: t.hostname, port: t.port, method: req.method, path: req.url,
        headers: { ...req.headers, host: t.host } }, (up) => { res.writeHead(up.statusCode ?? 502, up.headers); up.pipe(res); });
      p.on("error", () => { if (!res.headersSent) res.status(502).send("LearnChain is not running"); });
      req.pipe(p); // mounted before body parsers, so the raw body is still streamable
    });
  }
  const dir = process.env.STATIC_DIR;
  if (dir && fs.existsSync(dir)) {
    app.use(express.static(dir, { index: false }));
    app.get(/^(?!\/api|\/learnchain).*/, (_req, res) => res.sendFile(path.join(dir, "index.html")));
  }
}
