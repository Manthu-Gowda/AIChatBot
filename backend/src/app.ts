import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { exec } from "child_process";

import authRoutes from "./routes/auth";
import meRoutes from "./routes/me";
import settingsRoutes from "./routes/settings";
import projectRoutes from "./routes/projects";
import folderRoutes from "./routes/folders";
import chatRoutes from "./routes/chat";
import widgetRoutes from "./routes/widget";
import inquiryRoutes from "./routes/inquiry";
import configRoutes from "./routes/config";

import { prisma } from "./prisma/client";
import { authLimiter, chatLimiter } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/error";

dotenv.config({ path: path.resolve(".env") });
if (!process.env.DATABASE_URL) {
  const backendEnv = path.resolve(process.cwd(), "backend", ".env");
  try {
    if (fs.existsSync(backendEnv)) dotenv.config({ path: backendEnv });
  } catch {}
}

function checkRequiredEnvVars() {
  const required = ["DATABASE_URL", "JWT_SECRET", "ENCRYPTION_KEY"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error("\nFATAL: Missing required environment variables:\n" + missing.map((m) => ` - ${m}`).join("\n"));
    process.exit(1);
  }
}
checkRequiredEnvVars();

const app = express();

app.get("/version", (_req, res) => {
  res.json({ version: "ProjectLinkDebug-v1", timestamp: new Date().toISOString() });
});

app.use(express.json({ limit: "2mb" }));

// -------------------- CONFIG --------------------
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL
  ? String(process.env.RENDER_EXTERNAL_URL).replace(/\/+$/, "")
  : undefined;

const isProd = process.env.NODE_ENV === "production" || process.env.SERVE_FRONTEND === "true";

function resolveFrontendDist(): string {
  if (process.env.FRONTEND_DIST_PATH) return path.resolve(process.env.FRONTEND_DIST_PATH);

  const byCwd = path.resolve(process.cwd(), "frontend", "dist");
  if (fs.existsSync(byCwd)) return byCwd;

  const bySrc = path.resolve(__dirname, "..", "..", "frontend", "dist");
  if (fs.existsSync(bySrc)) return bySrc;

  return path.resolve(__dirname, "..", "..", "..", "frontend", "dist");
}
const FRONTEND_DIST = resolveFrontendDist();

const WIDGET_ALLOWED_ORIGINS = (process.env.WIDGET_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

// -------------------- CORS --------------------
const allowedOrigins = new Set(
  [
    FRONTEND_URL,
    BACKEND_URL,
    "http://localhost:4000",
    "http://127.0.0.1:4000",
    RENDER_EXTERNAL_URL,
    ...WIDGET_ALLOWED_ORIGINS,
  ].filter(Boolean)
);

app.use((req, res, next) => {
  cors({
    origin: function (origin, cb) {
      if (!origin) return cb(null, true);

      // Always allow widget api routes
      if (req.path.startsWith("/widget")) return cb(null, true);
      if (req.path.startsWith("/widget-layout")) return cb(null, true);

      if (allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error("CORS blocked"), false);
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })(req, res, next);
});

// -------------------- HELMET --------------------
// IMPORTANT: Apply helmet globally, BUT we will override CSP for /widget-layout.
if (isProd) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "img-src": ["'self'", "data:", "https:", "blob:"],
          "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
          "connect-src": ["'self'", "https:", "wss:"],
        },
      },
    })
  );
} else {
  app.use(helmet({ contentSecurityPolicy: false }));
}

// -------------------- WIDGET.JS (static file) --------------------
function resolveWidgetScript(): string {
  const candidates = [
    path.resolve(process.cwd(), "backend", "public", "widget.js"),
    path.resolve(process.cwd(), "public", "widget.js"),
    path.resolve(__dirname, "..", "..", "public", "widget.js"),
    path.resolve(__dirname, "..", "..", "..", "public", "widget.js"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return path.resolve(process.cwd(), "backend", "public", "widget.js");
}

app.get("/widget.js", (_req, res) => {
  const file = resolveWidgetScript();
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.sendFile(file);
});

// -------------------- ROUTES --------------------
app.use("/auth", authLimiter, authRoutes);
app.use("/me", meRoutes);
app.use("/settings", settingsRoutes);
app.use("/projects", projectRoutes);
app.use("/folders", folderRoutes);
app.use("/chat", chatLimiter, chatRoutes);
app.use("/widget", widgetRoutes);
app.use("/widget", inquiryRoutes);
app.use("/config", configRoutes);

// -------------------- WIDGET LAYOUT (MUST COME BEFORE SPA CATCH-ALL) --------------------
// This route must NOT be shadowed by app.get('*').
// It sets custom CSP with frame-ancestors allowed.
app.get(["/widget-layout", "/widget"], async (req, res) => {
  try {
    // Serve SPA entry; client-side route handles /widget-layout
    // Allow embedding
    res.removeHeader("X-Frame-Options");

    // Build frame-ancestors list
    const faParts: string[] = ["'self'"];

    if (RENDER_EXTERNAL_URL) faParts.push(RENDER_EXTERNAL_URL);
    if (WIDGET_ALLOWED_ORIGINS.length) faParts.push(...WIDGET_ALLOWED_ORIGINS);

    // Allow embedding based on projectLink origin (if projectId is present)
    const projectId = String((req.query as any).projectId || "");
    if (projectId) {
      try {
        const project = await prisma.project.findFirst({
          where: { id: projectId },
          select: { projectLink: true },
        });

        if (project?.projectLink) {
          try {
            const origin = new URL(project.projectLink).origin;
            faParts.push(origin);
          } catch {
            const cleaned = String(project.projectLink).replace(/\/+$/, "");
            if (cleaned) faParts.push(cleaned);
          }
        }
      } catch (err) {
        console.error("[Widget] Failed to load project for CSP:", err);
      }
    }

    // Dynamic localhost support (Origin or Referer might exist in iframe)
    const reqOrigin = (req.headers.origin as string) || (req.headers.referer as string) || "";
    if (reqOrigin) {
      try {
        const u = new URL(reqOrigin);
        const host = u.hostname.replace(/^\[|\]$/g, "");
        if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
          const originVal = `${u.protocol}//${u.host}`;
          if (!faParts.includes(originVal)) faParts.push(originVal);
          console.log("[Widget] Dynamically allowed localhost:", originVal);
        }
      } catch {}
    }

    const fa = Array.from(new Set(faParts)).filter(Boolean).join(" ");

    // Override CSP specifically for this response
    res.setHeader("Content-Security-Policy", `frame-ancestors ${fa}`);

    console.log("[Widget] CSP Set:", `frame-ancestors ${fa}`);
    return res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  } catch (err) {
    console.error("[Widget] widget-layout error:", err);
    return res.status(500).send("Widget layout error");
  }
});

// -------------------- SERVE FRONTEND (PROD) --------------------
if (isProd) {
  app.use(express.static(FRONTEND_DIST));

  // Catch-all must be AFTER widget-layout route
  app.get("*", (req, res, next) => {
    const accept = String(req.headers.accept || "");

    // Ensure widget routes don't get caught here
    if (req.path.startsWith("/widget") || req.path.startsWith("/widget-layout")) return next();

    if (req.method === "GET" && accept.includes("text/html")) {
      return res.sendFile(path.join(FRONTEND_DIST, "index.html"));
    }
    return next();
  });
}

app.use(errorHandler);

// -------------------- START --------------------
const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT} (prod=${isProd})`);
  console.log("Server started [v:ProjectLinkDebug]");
  if (isProd) console.log(`Serving frontend from: ${FRONTEND_DIST}`);

  const shouldOpen = !isProd && (process.env.SERVE_FRONTEND === "true" || process.env.OPEN_BROWSER === "true");
  const urlToOpen = isProd ? `http://localhost:${PORT}` : FRONTEND_URL;
  if (shouldOpen) {
    const platform = process.platform;
    const cmd =
      platform === "win32"
        ? `start "" "${urlToOpen}"`
        : platform === "darwin"
        ? `open "${urlToOpen}"`
        : `xdg-open "${urlToOpen}"`;
    exec(cmd, (err) => {
      if (err) console.error("Failed to open browser:", err.message);
    });
  }
});
