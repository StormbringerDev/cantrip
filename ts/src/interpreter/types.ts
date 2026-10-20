export const UNIT = Symbol("unit");
export type Unit = typeof UNIT;

export type Value = number | string | boolean | null | Unit;
