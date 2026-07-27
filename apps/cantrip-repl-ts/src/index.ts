import { Scanner, ScannerError } from "@cantrip/parser";
import type { Position } from "@cantrip/types";
import { readFileSync } from "fs";
import { join } from "path";
import promptSync from "prompt-sync";

let hadError = false;

function printUsage() {
  console.log("Usage: cantrip-ts [script]");
}

function report(position: Position, where: string, message: string) {
  console.error(
    `[Line ${position.line + 1} Column ${position.column + 1}] Error${where}: ${message}`,
  );
  hadError = true;
}

function run(source: string) {
  const scanner = new Scanner(source);
  const { tokens, errors } = scanner.scanTokens();

  // If there are errors, report errors and end execution
  if (errors.length > 0) {
    for (const error of errors) {
      if (error instanceof ScannerError) {
        report(error.position, "", error.message);
      }
    }
    return;
  }

  for (const token of tokens) {
    console.log(token.toString());
  }
}

function runFile(path: string) {
  const filePath = join(__dirname, path);
  try {
    const source = readFileSync(filePath, "utf-8");
    run(source);
  } catch (err) {
    console.error(err);
  }

  if (hadError) process.exit(65);
}

function runPrompt() {
  const prompt = promptSync({ sigint: true, eot: true });

  console.log("Welcome to the Cantrip REPL. Press Ctrl+D to exit:");
  console.log();

  for (;;) {
    const line = prompt("cantrip-ts > ");
    if (line) run(line);
    hadError = false;
  }
}

function main() {
  const args: string[] = process.argv.slice(2);
  if (args.length > 1) {
    printUsage();
    process.exit(64);
  } else if (args.length == 1) {
    runFile(args[0]);
  } else {
    runPrompt();
  }
}

main();
