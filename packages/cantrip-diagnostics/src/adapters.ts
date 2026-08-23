import type { Token } from "@cantrip/ast";
import type { Position } from "@cantrip/types";
import { diagnosticAt, diagnosticAtSpan, type DiagnosticFromOptions } from "./helpers.js";
import type { Diagnostic } from "./diagnostic.js";

export function diagnosticFromPosition(
  message: string,
  position: Position,
  opts?: DiagnosticFromOptions,
): Diagnostic {
  return diagnosticAt(message, position, opts);
}

export function diagnosticFromToken(
  message: string,
  token: Token,
  opts?: DiagnosticFromOptions,
): Diagnostic {
  return diagnosticAtSpan(message, token.span, opts);
}
