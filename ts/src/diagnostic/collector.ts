import type {
  Diagnostic,
  DiagnosticNote,
  Severity,
} from "../types/diagnostic.js";
import type { Span } from "../types/location.js";

interface EmitOpts {
  severity?: Severity;
  span?: Span;
  code?: string;
  notes?: readonly DiagnosticNote[];
}

export class DiagnosticCollector {
  private readonly diagnostics: Diagnostic[] = [];

  getDiagnostics(): readonly Diagnostic[] {
    return this.diagnostics;
  }

  emit(message: string, opts: EmitOpts = {}): void {
    const diag: Diagnostic = {
      severity: opts.severity ?? "error",
      message,
      span: opts.span,
      code: opts.code,
      notes: opts.notes,
    };
    this.diagnostics.push(diag);
  }

  error(message: string, opts: EmitOpts = {}): void {
    const options: EmitOpts = { ...opts, severity: "error" };
    this.emit(message, options);
  }

  warn(message: string, opts: EmitOpts = {}): void {
    const options: EmitOpts = { ...opts, severity: "warning" };
    this.emit(message, options);
  }

  info(message: string, opts: EmitOpts = {}): void {
    const options: EmitOpts = { ...opts, severity: "info" };
    this.emit(message, options);
  }

  hint(message: string, opts: EmitOpts = {}): void {
    const options: EmitOpts = { ...opts, severity: "hint" };
    this.emit(message, options);
  }

  clear(): void {
    this.diagnostics.length = 0;
  }

  hasError(): boolean {
    return this.diagnostics.some((diag) => diag.severity === "error");
  }
}
