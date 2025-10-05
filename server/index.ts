import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import memorystore from "memorystore";
import connectPg from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage, sessionPool } from "./storage";

const app = express();

// Trust proxy - required for secure cookies to work behind Render/Heroku proxies
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session setup - use PostgreSQL in production, memory in development
let sessionStore: session.Store;

if (process.env.NODE_ENV === "production") {
  // Use PostgreSQL session store in production for persistence across restarts
  const PgStore = connectPg(session);
  
  sessionStore = new PgStore({
    pool: sessionPool, // Reuse singleton pool from storage.ts to prevent connection leaks
    tableName: "session",
    createTableIfMissing: true,
    errorLog: (err) => {
      console.error("[Session Store Error]", err);
    },
  });
  
  // Listen for store errors to surface login failures
  sessionStore.on("error", (err) => {
    console.error("[Session Store Runtime Error]", err);
  });
  
  log("Using PostgreSQL session store for production");
} else {
  // Use memory store in development for faster iteration
  const MemoryStore = memorystore(session);
  sessionStore = new MemoryStore({
    checkPeriod: 86400000, // prune expired entries every 24h
  });
  
  log("Using in-memory session store for development");
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || "delitruck-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

app.set("sessionStore", sessionStore);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Schedule photo cleanup job
  const cleanupOldPhotos = async () => {
    try {
      const deletedCount = await storage.deleteOldImageMessages(24);
      if (deletedCount > 0) {
        log(`Deleted ${deletedCount} old photo messages`);
      }
    } catch (error) {
      console.error("Error cleaning up old photos:", error);
    }
  };

  // Run cleanup every hour
  setInterval(cleanupOldPhotos, 60 * 60 * 1000);
  
  // Also run cleanup on startup
  cleanupOldPhotos();

  // Schedule cleanup for messages older than 2 weeks
  const cleanupOldMessages = async () => {
    try {
      const deletedCount = await storage.deleteOldMessages(14);
      if (deletedCount > 0) {
        log(`Deleted ${deletedCount} messages older than 2 weeks`);
      }
    } catch (error) {
      console.error("Error cleaning up old messages:", error);
    }
  };

  // Run cleanup once a day (24 hours)
  setInterval(cleanupOldMessages, 24 * 60 * 60 * 1000);
  
  // Also run cleanup on startup
  cleanupOldMessages();
})();
