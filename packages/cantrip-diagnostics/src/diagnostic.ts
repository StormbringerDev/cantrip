import type { Span } from "@cantrip/types";

export type Severity = "error" | "warning" | "info" | "hint";

export interface DiagnosticNote {
  readonly message: string;
  readonly span?: Span;
}

/**
 * Canonical diagnostic used by every frontend (scanner, parser, interpreter,
 * and later the static analyzer / type checker).
 *
 * Keep this shape boring and JSON-serializable so the Rust side can mirror it later.
 */
export interface Diagnostic {
  readonly severity: Severity;
  readonly message: string;

  /** Optional machine code, e.g. "E0001", "R0012", "T0042" */
  readonly code?: string;

  /** Primary location. Optional for a few global / internal diagnostics. */
  readonly span?: Span;

  /**
   * Identifies which source this span belongs to.
   * Use "<repl>" for the interactive session, a path, or a synthetic id.
   */
  readonly sourceId?: string;

  /** Secondary information ("defined", "expected `}`", etc.) */
  readonly notes?: readonly DiagnosticNote[];
}

/** A named piece of source text the reporter can quote from. */
export interface SourceFile {
  /** Stable id used in Diagnostic.sourceId */
  readonly id: string;
  /** Full source text */
  readonly text: string;
  /** Optional display name (defaults to id) */
  readonly name?: string;
}
