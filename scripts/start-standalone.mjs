import { cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

function argValue(name) {
  const index = process.argv.indexOf(name);

  return index >= 0 ? process.argv[index + 1] : undefined;
}

const port = argValue("--port") ?? argValue("-p") ?? process.env.PORT ?? "3000";
const root = process.cwd();
const standaloneDir = join(root, ".next", "standalone");
const standaloneServer = join(standaloneDir, "server.js");
const publicDir = join(root, "public");
const standalonePublicDir = join(standaloneDir, "public");
const staticDir = join(root, ".next", "static");
const standaloneStaticDir = join(standaloneDir, ".next", "static");

if (!existsSync(standaloneServer)) {
  throw new Error("Standalone build output is missing. Run `npm run build` first.");
}

if (existsSync(publicDir)) {
  rmSync(standalonePublicDir, { force: true, recursive: true });
  cpSync(publicDir, standalonePublicDir, { recursive: true });
}

if (existsSync(staticDir)) {
  rmSync(standaloneStaticDir, { force: true, recursive: true });
  cpSync(staticDir, standaloneStaticDir, { recursive: true });
}

process.env.PORT = port;
await import(pathToFileURL(standaloneServer).href);
