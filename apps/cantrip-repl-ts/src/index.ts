import { Parser, Scanner } from "@cantrip/parser";
import { Resolver } from "@cantrip/analysis";
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
const diagnostics = new DiagnosticCollector();

function printUsage(): void {
  console.log("Usage: cantrip-ts [script]");
}

function run(
  source: string,
  interpreter: Interpreter,
  diagnostics: DiagnosticCollector,
  sourceId = REPL_SOURCE_ID,
): void {
  const sourceFile: SourceFile = { id: sourceId, text: source, name: sourceId };
  const sources = new Map([[sourceId, sourceFile]]);

  const tokens = new Scanner(source, diagnostics, sourceId).scanTokens();
  const ast = new Parser(tokens, diagnostics, sourceId).parse();

  // Stop if there was a syntax error.
  if (diagnostics.hasErrors()) {
    console.error(formatDiagnostics(diagnostics.diagnostics(), sources));
    hadError = true;
    return;
  }

  const resolver = new Resolver(interpreter, diagnostics, sourceId);
  resolver.resolve(ast);

  // Stop if there was a resolution error.
  if (diagnostics.hasErrors()) {
    console.error(formatDiagnostics(diagnostics.diagnostics(), sources));
    hadError = true;
    return;
  }

  interpreter.interpret(ast);

  if (diagnostics.hasErrors()) {
    console.error(formatDiagnostics(diagnostics.diagnostics(), sources));
  }
}

function runFile(diagnostics: DiagnosticCollector, path: string): void {
  const filePath = resolve(path);
  const interpreter = new Interpreter(diagnostics);
  try {
    const source = readFileSync(filePath, "utf-8");
    run(source, interpreter, diagnostics, basename(filePath));
  } catch (err) {
    console.error(err);
  }

  if (hadError) process.exit(65);
}

function runPrompt(diagnostics: DiagnosticCollector): void {
  const prompt = promptSync({ sigint: true, eot: true });
  const interpreter = new Interpreter(diagnostics, REPL_SOURCE_ID);

  console.log("Welcome to the Cantrip REPL. Press Ctrl+D to exit:");
  console.log();

  for (;;) {
    const line = prompt("> ");
    if (line) run(line, interpreter, diagnostics);
    hadError = false;
    diagnostics.clear();
  }
}

const args: string[] = process.argv.slice(2);
if (args.length > 1) {
  printUsage();
  process.exit(64);
} else if (args.length === 1) {
  runFile(diagnostics, args[0]);
} else {
  runPrompt(diagnostics);
}
