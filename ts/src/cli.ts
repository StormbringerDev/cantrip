import { access } from "fs/promises";
import { text } from "stream/consumers";

import { Command } from "commander";

export const version = "0.1.0";

export async function run(argv: string[]) {
  const program = new Command();

  program
    .name("cantrip")
    .description("Tree-walking interpreter for the Cantrip Scripting Language")
    .version(version)
    .argument("[script]", "script file to run; omit to start the REPL")
    .action(async (script: unknown) => {
      if (typeof script !== "string") {
        await startRepl();
        return;
      }
      await runScript(program, script);
    });

  await program.parseAsync(argv);
}

async function startRepl() {
  if (process.env.NODE_ENV === "test") process.stdout.write("repl\n");
  await text(process.stdin);
}

async function runScript(program: Command, script: string) {
  try {
    await access(script);
  } catch {
    program.error(`cannot open script: ${script}`, { exitCode: 1 });
  }

  if (process.env.NODE_ENV === "test") process.stdout.write(`${script}\n`);
}
