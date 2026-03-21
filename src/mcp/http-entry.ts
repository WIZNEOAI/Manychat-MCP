#!/usr/bin/env node

import { startProductionHttpServer } from "./serve.js";
import { log } from "../lib/logger.js";

startProductionHttpServer().catch((error) => {
  log.error("Failed to start ManyChat MCP HTTP server", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
