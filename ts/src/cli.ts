import { readFile } from "fs/promises";
import { createInterface } from "readline/promises";

import { Command } from "commander";

import { DiagnosticCollector } from "./diagnostic/collector.js";
import { formatDiagnostics } from "./diagnostic/format.js";
import { interpret } from "./interpreter/tree-walker.js";
import { Lexer } from "./parser/lexer.js";
import { Parser } from "./parser/parser.js";

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

function runSource(source: string, name?: string): boolean {
  const diagnostics = new DiagnosticCollector();
  const tokens = new Lexer(source, diagnostics).scan();
  const expr = new Parser(tokens, diagnostics).parse();

  if (diagnostics.hasError() || expr === null) {
    report(diagnostics, source, name);
    return false;
  }

  interpret(expr, diagnostics);
  if (diagnostics.hasError()) {
    report(diagnostics, source, name);
    return false;
  }

  return true;
}

function report(
  diagnostics: DiagnosticCollector,
  source: string,
  name?: string,
): void {
  const formatted = formatDiagnostics(diagnostics.getDiagnostics(), {
    name,
    text: source,
  });
  if (formatted.length === 0) return;
  process.stderr.write(`${formatted}\n`);
}

async function startRepl() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  rl.prompt();
  for await (const line of rl) {
    runSource(line);
    rl.prompt();
  }
  rl.close();
}

async function runScript(program: Command, script: string) {
  let source: string;
  try {
    source = await readFile(script, "utf8");
  } catch {
    program.error(`cannot open script: ${script}`, { exitCode: 1 });
  }

  if (!runSource(source, script)) {
    process.exitCode = 1;
  }
}
