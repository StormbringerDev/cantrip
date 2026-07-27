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
