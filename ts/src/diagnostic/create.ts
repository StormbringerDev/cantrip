import type {
  Diagnostic,
  DiagnosticNote,
  Severity,
} from "../types/diagnostic.js";
import type { Span } from "../types/location.js";

interface DiagnosticDetails {
  readonly code?: string;
  readonly notes?: readonly DiagnosticNote[];
}

type DiagnosticAt = Span | { readonly span: Span };

function spanOf(at: DiagnosticAt): Span {
  if ("span" in at) return at.span;
  return at;
}

function diagnostic(
  severity: Severity,
  message: string,
  at: DiagnosticAt,
  details?: DiagnosticDetails,
): Diagnostic {
  return {
    severity,
    message,
    span: spanOf(at),
    ...details,
  };
}

export function error(
  message: string,
  at: DiagnosticAt,
  details?: DiagnosticDetails,
): Diagnostic {
  return diagnostic("error", message, at, details);
}

export function warning(
  message: string,
  at: DiagnosticAt,
  details?: DiagnosticDetails,
): Diagnostic {
  return diagnostic("warning", message, at, details);
}

export function info(
  message: string,
  at: DiagnosticAt,
  details?: DiagnosticDetails,
): Diagnostic {
  return diagnostic("info", message, at, details);
}

export function hint(
  message: string,
  at: DiagnosticAt,
  details?: DiagnosticDetails,
): Diagnostic {
  return diagnostic("hint", message, at, details);
}
