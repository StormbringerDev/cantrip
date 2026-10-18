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

  async function run(args: string[] = []) {
    return cli.run(args, { cwd: directory.path });
  }

  it("outputs the correct version", async () => {
    const result = await run(["-V"]);

    expect(result).toSucceed();
    expect(result).toHaveStdout(version);
    expect(result.cwd).toBe(directory.path);
  });

  it("starts the REPL when no script is given", async () => {
    const result = await run();

    expect(result).toSucceed();
    expect(result).toHaveStdout("repl\n");
    expect(result.cwd).toBe(directory.path);
  });

  it("runs a script from the scratch directory", async () => {
    const script = await directory.file({
      filename: "hello.cantrip",
      content: "print(1);\n",
    });

    const result = await run([script.path]);

    expect(result).toSucceed();
    expect(result).toHaveStdout(`${script.path}\n`);
    expect(result.cwd).toBe(directory.path);
    expect(await script.text()).toBe("print(1);\n");
  });

  it("fails when the script is missing", async () => {
    const result = await run(["missing.cantrip"]);

    expect(result).toFail();
    expect(result).toExitWith(1);
    expect(result).toHaveStderr("cannot open script: missing.cantrip");
    expect(result.cwd).toBe(directory.path);
  });
});
