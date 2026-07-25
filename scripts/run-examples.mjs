#!/usr/bin/env node
/**
 * Simple example runner that works without a full build.
 * Usage (from repo root, after pnpm install && pnpm build):
 *   node scripts/run-examples.mjs
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Dynamic import so it works after build
const { run } = await import(join(root, "packages/cantrip-interpreter/dist/index.js"));

const examplesDir = join(root, "examples");
const files = readdirSync(examplesDir)
  .filter((f) => f.endsWith(".ctrp"))
  .sort();

let passed = 0;
let failed = 0;

console.log("Running Cantrip examples...\n");

for (const file of files) {
  const path = join(examplesDir, file);
  const source = readFileSync(path, "utf-8");
  process.stdout.write(`  ${file} ... `);

  const result = run(source);
  if (result.ok) {
    console.log("ok");
    passed++;
  } else {
    console.log("FAIL");
    console.error(`    ${result.error}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
