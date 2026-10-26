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
    for (const sub of ["frameless", "gallery", "fractal-house"]) {
      app.use(`/${sub}`, express.static(path.join(dir, sub), { index: "index.html" }));
      app.get(new RegExp(`^/${sub}(/.*)?$`), (_req, res) => res.sendFile(path.join(dir, sub, "index.html")));
    }
    app.get("/xmr-mine", (_req, res) => {
      const og = `<title>Monero Browser Mining (opt-in) | Universe Simon</title>
    <meta name="description" content="Opt-in Monero (XMR) browser mining dashboard: mine to your own address on MoneroOcean, see a realistic earnings estimate. Never auto-starts; uses your CPU; earnings are tiny." />
    <meta property="og:title" content="Monero Browser Mining (opt-in) | Universe Simon" />
    <meta property="og:description" content="Your address, your CPU, honest earnings estimate. Never auto-starts." />
    <meta property="og:image" content="https://universe-simon-hub.onrender.com/fractal-house/mandelbulb.jpg" />
    <meta property="og:url" content="https://universe-simon-hub.onrender.com/xmr-mine" />
    <meta name="twitter:card" content="summary_large_image" />`;
      const html = fs.readFileSync(path.join(dir, "index.html"), "utf8")
        .replace(/<title>[\s\S]*?<meta name="twitter:card"[^>]*>/, og);
      res.type("html").send(html);
    });
    app.use(express.static(dir, { index: false }));
    app.get(/^(?!\/api|\/learnchain).*/, (_req, res) => res.sendFile(path.join(dir, "index.html")));
  }
}
