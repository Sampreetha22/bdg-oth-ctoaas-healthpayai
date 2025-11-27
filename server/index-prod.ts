import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type Server } from "node:http";

import express, { type Express } from "express";

import { normalizeBasePath } from "./base-path";
import runApp from "./app";

export async function serveStatic(app: Express, _server: Server) {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.resolve(dirname, "public");
  const basePath = normalizeBasePath(process.env.BASE_PATH);

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(basePath, express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use(`${basePath}*`, (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

(async () => {
  await runApp(serveStatic);
})();
