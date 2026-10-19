import type { Diagnostic } from "../types/diagnostic.js";
import type { Span } from "../types/location.js";

const TAB_WIDTH = 4;

export interface FormatSource {
  readonly name?: string;
  readonly text: string;
}

interface Line {
  readonly number: number;
  readonly text: string;
  readonly offset: number;
}

interface Point {
  readonly lineNumber: number;
  readonly column: number;
  readonly lineIndex: number;
}

type Highlight =
  | { readonly kind: "point"; readonly at: Point }
  | {
      readonly kind: "range";
      readonly firstIndex: number;
      readonly lastIndex: number;
      readonly startOffset: number;
      readonly endOffset: number;
    };

interface Resolved {
  readonly line: number;
  readonly column: number;
  readonly highlight: Highlight | null;
}

type Row =
  | { readonly kind: "elision" }
  | {
      readonly kind: "line";
      readonly lineIndex: number;
      readonly isLast: boolean;
    };

export function formatDiagnostic(
  diagnostic: Diagnostic,
  source: FormatSource,
): string {
  const lines = splitLines(source.text);
  const primary = diagnostic.span
    ? resolveSpan(lines, source.text, diagnostic.span)
    : null;
  const notes = (diagnostic.notes ?? []).map((note) => ({
    message: note.message,
    highlight: note.span
      ? resolveSpan(lines, source.text, note.span).highlight
      : null,
  }));

  const numbers: number[] = [];
  if (primary) {
    numbers.push(primary.line);
    if (primary.highlight) {
      numbers.push(...highlightedLines(lines, primary.highlight));
    }
  }
  for (const note of notes) {
    if (note.highlight) {
      numbers.push(...highlightedLines(lines, note.highlight));
    }
  }

  const gutter = gutterWidth(numbers);
  const out = [diagnosticHeader(diagnostic)];
  if (primary) {
    out.push(locationLine(source.name, primary.line, primary.column, gutter));
    if (primary.highlight) {
      out.push(...renderSnippet(lines, primary.highlight, gutter));
    }
  }
  for (const note of notes) {
    if (note.highlight) {
      out.push(...renderSnippet(lines, note.highlight, gutter, note.message));
    } else {
      out.push(`  = note: ${note.message}`);
    }
  }
  return out.join("\n");
}

export function formatDiagnostics(
  diagnostics: readonly Diagnostic[],
  source: FormatSource,
): string {
  return diagnostics
    .map((diagnostic) => formatDiagnostic(diagnostic, source))
    .join("\n\n");
}

function diagnosticHeader(diagnostic: Diagnostic): string {
  const code = diagnostic.code ? `[${diagnostic.code}]` : "";
  return `${diagnostic.severity}${code}: ${diagnostic.message}`;
}

function resolveSpan(
  lines: readonly Line[],
  text: string,
  span: Span,
): Resolved {
  const start = pointAt(lines, text, span.start.offset);
  if (!start) {
    return {
      line: span.start.line,
      column: span.start.column,
      highlight: null,
    };
  }
  return {
    line: start.lineNumber,
    column: start.column,
    highlight: locateHighlight(lines, text, span),
  };
}

function splitLines(text: string): Line[] {
  const lines: Line[] = [];
  let offset = 0;
  let number = 1;

  while (offset <= text.length) {
    const newlineAt = text.indexOf("\n", offset);
    if (newlineAt === -1) {
      lines.push({ number, text: text.slice(offset), offset });
      break;
    }

    let end = newlineAt;
    if (end > offset && text[end - 1] === "\r") end -= 1;
    lines.push({ number, text: text.slice(offset, end), offset });

    offset = newlineAt + 1;
    number += 1;
    if (offset === text.length) break;
  }

  return lines;
}

/** Half-open offsets. A trailing newline puts EOF on the following empty line. */
function pointAt(
  lines: readonly Line[],
  text: string,
  offset: number,
): Point | null {
  if (!Number.isInteger(offset) || offset < 0 || offset > text.length) {
    return null;
  }

  if (text.endsWith("\n") && offset === text.length) {
    return {
      lineNumber: lines.length + 1,
      column: 1,
      lineIndex: lines.length,
    };
  }

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const next =
      index + 1 < lines.length ? lines[index + 1].offset : text.length + 1;
    if (offset < line.offset || offset >= next) continue;

    return {
      lineNumber: line.number,
      column: displayColumn(
        line.text,
        Math.min(offset - line.offset, line.text.length),
      ),
      lineIndex: index,
    };
  }

  return null;
}

function locateHighlight(
  lines: readonly Line[],
  text: string,
  span: Span,
): Highlight | null {
  if (span.end.offset < span.start.offset) return null;

  const start = pointAt(lines, text, span.start.offset);
  const end = pointAt(lines, text, span.end.offset);
  if (!start || !end) return null;

  if (span.start.offset === span.end.offset) {
    return { kind: "point", at: start };
  }

  const last = pointAt(lines, text, span.end.offset - 1);
  if (!last || last.lineIndex < start.lineIndex) return null;

  return {
    kind: "range",
    firstIndex: start.lineIndex,
    lastIndex: last.lineIndex,
    startOffset: span.start.offset,
    endOffset: span.end.offset,
  };
}

function charWidth(char: string): number {
  return char === "\t" ? TAB_WIDTH : 1;
}

function displayColumn(text: string, charIndex: number): number {
  let column = 1;
  for (const char of text.slice(0, charIndex).split("")) {
    column += charWidth(char);
  }
  return column;
}

function expandTabs(text: string): string {
  let expanded = "";
  for (const char of text.split("")) {
    expanded += char === "\t" ? " ".repeat(TAB_WIDTH) : char;
  }
  return expanded;
}

function highlightedLines(
  lines: readonly Line[],
  highlight: Highlight,
): number[] {
  const numbers: number[] = [];
  for (const row of rowsOf(highlight)) {
    if (row.kind === "line") numbers.push(lineNumber(lines, row.lineIndex));
  }
  return numbers;
}

function lineNumber(lines: readonly Line[], lineIndex: number): number {
  return lines[lineIndex]?.number ?? lines.length + 1;
}

function gutterWidth(numbers: readonly number[]): number {
  let width = 1;
  for (const number of numbers) width = Math.max(width, String(number).length);
  return width;
}

function locationLine(
  name: string | undefined,
  line: number,
  column: number,
  gutter: number,
): string {
  const at = `${String(line)}:${String(column)}`;
  const where = name ? `${name}:${at}` : at;
  return `${" ".repeat(gutter)}--> ${where}`;
}

function rowsOf(highlight: Highlight): Row[] {
  if (highlight.kind === "point") {
    return [{ kind: "line", lineIndex: highlight.at.lineIndex, isLast: true }];
  }

  const first = highlight.firstIndex;
  const last = highlight.lastIndex;
  if (last - first + 1 > 3) {
    return [
      { kind: "line", lineIndex: first, isLast: false },
      { kind: "elision" },
      { kind: "line", lineIndex: last, isLast: true },
    ];
  }

  const rows: Row[] = [];
  for (let index = first; index <= last; index++) {
    rows.push({ kind: "line", lineIndex: index, isLast: index === last });
  }
  return rows;
}

function renderSnippet(
  lines: readonly Line[],
  highlight: Highlight,
  gutter: number,
  label?: string,
): string[] {
  const out = [`${" ".repeat(gutter)} |`];
  for (const row of rowsOf(highlight)) {
    if (row.kind === "elision") {
      out.push("...");
      continue;
    }

    const line =
      row.lineIndex < lines.length ? lines[row.lineIndex] : undefined;
    const text = line === undefined ? "" : expandTabs(line.text);
    out.push(
      `${String(lineNumber(lines, row.lineIndex)).padStart(gutter)} | ${text}`,
    );
    const carets = lineCarets(line, highlight);
    const marked =
      row.isLast && label !== undefined ? `${carets} ${label}` : carets;
    out.push(`${" ".repeat(gutter)} | ${marked}`);
  }
  return out;
}

function lineCarets(line: Line | undefined, highlight: Highlight): string {
  if (highlight.kind === "point") {
    return `${" ".repeat(Math.max(highlight.at.column - 1, 0))}^`;
  }
  if (!line) return "^";
  return rangeCarets(line, highlight.startOffset, highlight.endOffset);
}

function rangeCarets(
  line: Line,
  startOffset: number,
  endOffset: number,
): string {
  let carets = "";
  let any = false;
  for (let index = 0; index < line.text.length; index++) {
    const marked =
      line.offset + index >= startOffset && line.offset + index < endOffset;
    carets += (marked ? "^" : " ").repeat(charWidth(line.text.charAt(index)));
    if (marked) any = true;
  }
  if (any) return carets.trimEnd();

  const contentEnd = line.offset + line.text.length;
  const column =
    startOffset >= contentEnd ? displayColumn(line.text, line.text.length) : 1;
  return `${" ".repeat(Math.max(column - 1, 0))}^`;
}
