/** Source position with 1-based line & column, 0-based string offset. */
export interface Position {
  readonly line: number;
  readonly column: number;
  readonly offset: number; // Offset from beginning of string
}

export interface Span {
  readonly start: Position;
  readonly end: Position;
}

export function spanAt(pos: Position): Span {
  return { start: pos, end: pos };
}
