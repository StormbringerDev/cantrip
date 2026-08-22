import type { Span } from "@cantrip/types";
import type { Diagnostic, SourceFile } from "./diagnostic.js";

function displayName(
  source: SourceFile | undefined,
  sourceId: string | undefined,
): string {
  if (source?.name) return source.name;
  if (source?.id) return source.id;
  return sourceId ?? "<unknown>";
}

function extractLine(text: string, line: number): string {
  // line is 0-based
  const lines = text.split(/\r?\n/);
  return lines[line] ?? "";
}

function underline(span: Span, lineText: string): string {
  const startCol = span.start.column;
  const endCol =
    span.start.line === span.end.line
      ? Math.max(span.end.column, startCol + 1)
      : lineText.length;

  const pad = " ".repeat(Math.max(0, startCol));
  const marks = "^".repeat(Math.max(1, endCol - startCol));
  return pad + marks;
}

/**
 * Format a single diagnostic into a human-readable multi-line string.
 */
export function formatDiagnostic(
  diag: Diagnostic,
  sources: ReadonlyMap<string, SourceFile> = new Map(),
): string {
  const sourceId = diag.sourceId ?? "<unknown>";
  const source = sources.get(sourceId);
  const name = displayName(source, sourceId);

  const severity = diag.severity;
  const codePart = diag.code ? `[${diag.code}]` : "";
  const header = `${severity}${codePart}: ${diag.message}`;

  if (!diag.span) {
    return header;
  }

  const { start } = diag.span;
  // 1-based for users
  const loc = `${name}:${start.line + 1}:${start.column + 1}`;
  const lines: string[] = [header, ` --> ${loc}`];

  if (source) {
    const lineText = extractLine(source.text, start.line);
    const gutter = String(start.line + 1);
    const gutterWidth = gutter.length;

    lines.push(`${" ".repeat(gutterWidth)} |`);
    lines.push(`${gutter} | ${lineText}`);
    lines.push(`${" ".repeat(gutterWidth)} | ${underline(diag.span, lineText)}`);
  }

  if (diag.notes) {
    for (const note of diag.notes) {
      lines.push(`  = note: ${note.message}`);
    }
  }

  return lines.join("\n");
}

/**
 * Format many diagnostics, separated by blank lines.
 */
export function formatDiagnostics(
  diagnostics: readonly Diagnostic[],
  sources: ReadonlyMap<string, SourceFile> = new Map(),
): string {
  return diagnostics.map((d) => formatDiagnostic(d, sources)).join("\n\n");
}
