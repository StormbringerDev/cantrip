import { readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = fileURLToPath(new URL("..", import.meta.url));

export function examplesDir(): string {
  return resolve(packageDir, "../../examples");
}

console.log(examplesDir());

export function exampleFiles(): string[] {
  const files: string[] = [];
  collectCantrip(examplesDir(), files);
  files.sort();
  return files;
}

function collectCantrip(dir: string, out: string[]): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectCantrip(path, out);
    } else if (extname(entry.name) === ".cantrip") {
      out.push(path);
    }
  }
}
