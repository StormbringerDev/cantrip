import { Parser, Scanner } from "@cantrip/parser";
import { Interpreter } from "@cantrip/interpreter";
import {
  DiagnosticCollector,
  formatDiagnostics,
  type SourceFile,
} from "@cantrip/diagnostics";
import { readFileSync } from "fs";
import { basename, resolve } from "path";
import promptSync from "prompt-sync";

let hadError = false;
const REPL_SOURCE_ID = "<repl>";
const interpreter = new Interpreter();

function printUsage(): void {
  console.log("Usage: cantrip-ts [script]");
}

function run(source: string, sourceId = REPL_SOURCE_ID): void {
  const sourceFile: SourceFile = { id: sourceId, text: source, name: sourceId };
  const sources = new Map([[sourceId, sourceFile]]);
  const diagnostics = new DiagnosticCollector();

  const tokens = new Scanner(source, diagnostics, sourceId).scanTokens();
  const ast = new Parser(tokens, diagnostics, sourceId).parse();

  if (diagnostics.hasErrors()) {
    console.error(formatDiagnostics(diagnostics.diagnostics(), sources));
    hadError = true;
    return;
  }

  const statements = ast.filter((s) => s !== null);
  interpreter.interpret(statements);
}

function runFile(path: string): void {
  const filePath = resolve(path);
  try {
    const source = readFileSync(filePath, "utf-8");
    run(source, basename(filePath));
  } catch (err) {
    console.error(err);
  }

  if (hadError) process.exit(65);
}

function runPrompt(): void {
  const prompt = promptSync({ sigint: true, eot: true });

  console.log("Welcome to the Cantrip REPL. Press Ctrl+D to exit:");
  console.log();

  for (;;) {
    const line = prompt("> ");
    if (line) run(line);
    hadError = false;
  }
}

const args: string[] = process.argv.slice(2);
if (args.length > 1) {
  printUsage();
  process.exit(64);
} else if (args.length === 1) {
  runFile(args[0]);
} else {
  runPrompt();
}
