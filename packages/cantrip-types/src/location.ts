/** 0-based line and column */
export interface Position {
  readonly line: number;
  readonly column: number;
  readonly offset: number; // absolute character offset in the source
}

/** Inclusive start, exclusive end */
export interface Span {
  readonly start: Position;
  readonly end: Position;
}

/** Create a zero-width span at a position */
export function spanAt(pos: Position): Span {
  return { start: pos, end: pos };
}
