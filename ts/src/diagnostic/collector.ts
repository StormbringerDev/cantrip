import type { Diagnostic } from "../types/diagnostic.js";

export class DiagnosticCollector {
  private readonly diagnostics: Diagnostic[] = [];

  getDiagnostics(): readonly Diagnostic[] {
    return this.diagnostics;
  }

  emit(diagnostic: Diagnostic): void {
    this.diagnostics.push(diagnostic);
  }

  clear(): void {
    this.diagnostics.length = 0;
  }

  hasError(): boolean {
    return this.diagnostics.some((diag) => diag.severity === "error");
  }
}
