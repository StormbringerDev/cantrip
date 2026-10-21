export const UNIT = Symbol("unit");
export type Unit = typeof UNIT;

export type Value = number | string | boolean | null | Unit | CantripFunction;

export interface CantripFunction {
  arity: number;
  call: (args: Value[]) => Value;
  toString: () => string;
}

export function stringify(value: Value): string {
  if (value === null) return "nil";
  if (value === UNIT) return "()";

  return value.toString();
}
