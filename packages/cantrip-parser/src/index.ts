import type { Stmt, Token } from "@cantrip/ast";
import { type Diagnostic, DiagnosticCollector } from "@cantrip/diagnostics";
import { fromScannerError, Scanner } from "./scanner.js";
import { fromParseError, Parser } from "./parser.js";

export { fromParseError, Parser, ParseError } from "./parser.js";
export { fromScannerError, Scanner, ScannerError } from "./scanner.js";

export function scanAndParse(
  source: string,
  sourceId = "<input>",
): {
  tokens: Token[];
  ast: (Stmt | null)[];
  diagnostics: readonly Diagnostic[];
} {
  const collector = new DiagnosticCollector();

  const scanner = new Scanner(source);
  const { tokens, scannerErrors } = scanner.scanTokens();
  for (const e of scannerErrors) {
    collector.emit(fromScannerError(e, { sourceId }));
  }

  const parser = new Parser(tokens);
  const { ast, parseErrors } = parser.parse();
  for (const e of parseErrors) {
    collector.emit(fromParseError(e, { sourceId }));
  }

  return {
    tokens,
    ast,
    diagnostics: collector.diagnostics(),
  };
}
