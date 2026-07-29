import { TokenType } from "@cantrip/ast";
import { AstPrinter } from "@cantrip/interpreter";
import { Parser, ParseError, Scanner, ScannerError } from "@cantrip/parser";
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
  const { tokens, scannerErrors } = scanner.scanTokens();
  const parser = new Parser(tokens);
  const { ast, parseErrors } = parser.parse();
  const errors: Error[] = [...scannerErrors, ...parseErrors];

  // If there are errors, report errors and end execution
  if (errors.length > 0) {
    for (const error of errors) {
      if (error instanceof ScannerError) {
        report(error.position, "", error.message);
      } else if (error instanceof ParseError) {
        if (error.token.type === TokenType.Eof) {
          report(error.token.span.start, " at end", error.message);
        } else {
          report(
            error.token.span.start,
            " at '" + error.token.lexeme + "'",
            error.message,
          );
        }
      }
    }
    return;
  }

  const printer = new AstPrinter();
  console.log(printer.print(ast));
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
