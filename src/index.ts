#!/usr/bin/env node

import { runCli } from "./cli/app.js";
import { log } from "./lib/logger.js";
import { startLegacyMcpServer } from "./mcp/serve.js";

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === "mcp" && args[1] === "serve") {
    await startLegacyMcpServer(args.slice(2));
    return;
  }

  const io = { stdout: [] as string[], stderr: [] as string[] };
  const exitCode = await runCli(args, io);
  if (io.stdout.length > 0) {
    process.stdout.write(`${io.stdout.join("")}\n`);
  }
  if (io.stderr.length > 0) {
    process.stderr.write(`${io.stderr.join("")}\n`);
  }
  process.exit(exitCode);
}

main().catch((err) => {
  log.error("Failed to start ManyChat CLI", { error: String(err) });
  process.exit(1);
});
