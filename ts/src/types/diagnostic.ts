import { Span } from "./location.js";

export type Severity = "error" | "warning" | "info" | "hint";

export interface Diagnostic {
  readonly severity: Severity;
  readonly message: string;
  readonly span?: Span;
  readonly code?: string;
  readonly notes?: readonly DiagnosticNote[];
}

export interface DiagnosticNote {
  readonly message: string;
  readonly span?: Span;
}
