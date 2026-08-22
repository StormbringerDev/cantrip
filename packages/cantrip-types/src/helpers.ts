import type { Position, Span } from "./location.js";
import { spanAt } from "./location.js";
import type { Diagnostic, DiagnosticNote, Severity } from "./diagnostic.js";

export interface DiagnosticFromOptions {
  severity?: Severity;
  code?: string;
  sourceId?: string;
  notes?: readonly DiagnosticNote[];
}

/** Zero-width diagnostic at a single position */
export function diagnosticAt(
  message: string,
  position: Position,
  opts: DiagnosticFromOptions = {},
): Diagnostic {
  return {
    severity: opts.severity ?? "error",
    message,
    span: spanAt(position),
    code: opts.code,
    sourceId: opts.sourceId,
    notes: opts.notes,
  };
}

/** Diagnostic covering an existing span */
export function diagnosticAtSpan(
  message: string,
  span: Span,
  opts: DiagnosticFromOptions = {},
): Diagnostic {
  return {
    severity: opts.severity ?? "error",
    message,
    span,
    code: opts.code,
    sourceId: opts.sourceId,
    notes: opts.notes,
  };
}
