/**
 * Reads Stripe publishable key from disk (used by next.config.ts at startup).
 * Keeps logic next to config so we don't depend on path aliases during config load.
 */
import fs from "fs";
import path from "path";

function parseDotenvContent(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

/** Find monorepo / machine paths where `.env.local` might live. */
function candidateRoots(): string[] {
  const roots = new Set<string>();
  roots.add(process.cwd());

  let dir = process.cwd();
  for (let i = 0; i < 14; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
          name?: string;
        };
        const hasNext =
          fs.existsSync(path.join(dir, "next.config.ts")) ||
          fs.existsSync(path.join(dir, "next.config.js")) ||
          fs.existsSync(path.join(dir, "next.config.mjs"));
        if (pkg.name === "frontend" && hasNext) {
          roots.add(dir);
        }
      } catch {
        /* ignore */
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  roots.add(path.join(process.cwd(), "frontend"));
  return [...roots];
}

/** Synchronous read for next.config + API route fallback. */
export function readEnvVarFromDisk(key: string): string {
  const files = [".env.local", ".env"];

  for (const root of candidateRoots()) {
    for (const name of files) {
      const full = path.join(root, name);
      try {
        if (!fs.existsSync(full)) continue;
        const parsed = parseDotenvContent(fs.readFileSync(full, "utf8"));
        const k = parsed[key]?.trim();
        if (k) return k;
      } catch {
        /* ignore */
      }
    }
  }
  return "";
}

export function readPublishableKeyFromDisk(): string {
  return readEnvVarFromDisk("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}
