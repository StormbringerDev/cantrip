import type { Diagnostic } from "./diagnostic.js";
import type { Span } from "./location.js";

export interface EmitOptions {
  span?: Span;
  sourceId?: string;
  code?: string;
  notes?: Diagnostic["notes"];
}

/**
 * Accumulates diagnostics. Front-ends only call emit / the convenience methods.
 * Reporting (pretty-printing, colors, etc.) lives elsewhere.
 */
export class DiagnosticCollector {
  private readonly _diagnostics: Diagnostic[] = [];

  emit(diag: Diagnostic): void {
    this._diagnostics.push(diag);
  }

  error(message: string, opts: EmitOptions = {}): void {
    this.emit({ severity: "error", message, ...opts });
  }

  warning(message: string, opts: EmitOptions = {}): void {
    this.emit({ severity: "warning", message, ...opts });
  }

  info(message: string, opts: EmitOptions = {}): void {
    this.emit({ severity: "info", message, ...opts });
  }

  hint(message: string, opts: EmitOptions = {}): void {
    this.emit({ severity: "hint", message, ...opts });
  }

  hasErrors(): boolean {
    return this._diagnostics.some((d) => d.severity === "error");
  }

  diagnostics(): readonly Diagnostic[] {
    return this._diagnostics;
  }

  clear(): void {
    this._diagnostics.length = 0;
  }
}
