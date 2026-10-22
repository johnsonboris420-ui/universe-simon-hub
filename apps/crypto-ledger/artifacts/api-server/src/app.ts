import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { mountHosting } from "./lib/hosting";

const app: Express = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // Render/Cloudflare sit in front; needed for per-client rate limits

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "connect-src": ["'self'"],
        "frame-ancestors": ["'none'"],
        "form-action": ["'self'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
      },
    },
    strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

// General limit for everything, tighter one for routes that call external services or write.
app.use(rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false }));
const apiLimit = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: "draft-8", legacyHeaders: false,
  message: { error: "Too many requests, slow down." } });
const writeLimit = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false,
  skip: (req) => req.method === "GET" || req.method === "HEAD", message: { error: "Too many requests, slow down." } });

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// Same-origin app: only allow cross-origin reads from origins listed in CORS_ORIGINS.
const allowed = (process.env.CORS_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: allowed.length ? allowed : false }));
app.use(["/api", "/learnchain"], writeLimit);
app.use("/api", apiLimit);
mountHosting(app); // before body parsers (proxy needs raw stream)
app.use(express.json({ limit: "100kb" }));
app.use(express.text({ type: ["text/csv", "text/plain"], limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

app.use("/api", router);

app.use("/api", (_req, res) => { res.status(404).json({ error: "Not found" }); });
// JSON errors without stack traces.
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = typeof err?.status === "number" && err.status >= 400 && err.status < 600 ? err.status : 500;
  if (status >= 500) req.log?.error({ err }, "Unhandled error");
  res.status(status).json({ error: status >= 500 ? "Internal server error" : "Bad request" });
});

export default app;
