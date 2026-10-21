import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  commandLine,
  extendMatchers,
  scratchDirectory,
  type ScratchDirectory,
} from "vitest-command-line";

import { version } from "../src/cli.js";

extendMatchers();

const entrypoint = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/index.ts",
);

describe("cantrip cli", () => {
  const cli = commandLine({
    command: ["tsx", entrypoint],
    name: "cantrip",
    env: { FORCE_COLOR: "0" },
    timeout: 2_000,
    subprocessCleanup: "process-tree",
  });
  let directory: ScratchDirectory;

  beforeEach(async () => {
    directory = scratchDirectory();
    await directory.create();
  });

  afterEach(async () => {
    await directory.remove();
  });

  async function run(args: string[] = [], input?: string) {
    return cli.run(args, { cwd: directory.path, input });
  }

  it("outputs the correct version", async () => {
    const result = await run(["-V"]);

    expect(result).toSucceed();
    expect(result).toHaveStdout(version);
    expect(result.cwd).toBe(directory.path);
  });

  it("starts the REPL when no script is given", async () => {
    const result = await run([], "");

    expect(result).toSucceed();
    expect(result.stdout.startsWith("> ")).toBe(true);
    expect(result.cwd).toBe(directory.path);
  });

  it("evaluates REPL lines and continues after errors", async () => {
    const result = await run([], "print(40 + 2);\n1 + @\n1 + true;\n");

    expect(result).toSucceed();
    expect(result).toExitWith(0);
    expect(result.stdout.startsWith("> ")).toBe(true);
    expect(result).toHaveStdout("42");
    expect(result).toHaveStderr("unexpected character");
    expect(result).toHaveStderr("expect expression");
    expect(result).toHaveStderr(
      "operands must be two numbers or at least one string",
    );
    expect(result.stdout).not.toMatch(/(^|\n)1(\n|$)/);
  });

  it("runs a script from the scratch directory", async () => {
    const script = await directory.file({
      filename: "hello.cantrip",
      content: "print(40 + 2);\n",
    });

    const result = await run([script.path]);

    expect(result).toSucceed();
    expect(result).toHaveStdout("42");
    expect(result.cwd).toBe(directory.path);
    expect(await script.text()).toBe("print(40 + 2);\n");
  });

  it("fails a script when lexing and parsing report errors", async () => {
    const script = await directory.file({
      filename: "bad.cantrip",
      content: "1 + @\n",
    });

    const result = await run([script.path]);

    expect(result).toFail();
    expect(result).toExitWith(1);
    expect(result).toHaveStderr("unexpected character");
    expect(result).toHaveStderr("expect expression");
    expect(result).toHaveStderr(script.path);
    expect(result.stdout).toBe("");
  });

  it("fails a script on a runtime error", async () => {
    const script = await directory.file({
      filename: "runtime.cantrip",
      content: "1 + true;\n",
    });

    const result = await run([script.path]);

    expect(result).toFail();
    expect(result).toExitWith(1);
    expect(result).toHaveStderr(
      "operands must be two numbers or at least one string",
    );
    expect(result.stdout).toBe("");
  });

  it("fails when the script is missing", async () => {
    const result = await run(["missing.cantrip"]);

    expect(result).toFail();
    expect(result).toExitWith(1);
    expect(result).toHaveStderr("cannot open script: missing.cantrip");
    expect(result.cwd).toBe(directory.path);
  });
});
