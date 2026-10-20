import { Token } from "../parser/token.js";
import { RuntimeError } from "./exceptions.js";
import type { Value } from "./types.js";

export class Environment {
  readonly enclosing: Environment | null;
  private readonly values = new Map<string, Value>();

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing ?? null;
  }

  get(name: Token): Value {
    if (this.values.has(name.lexeme))
      return this.values.get(name.lexeme) as Value;

    if (this.enclosing !== null) return this.enclosing.get(name);

    throw new RuntimeError(name, `undefined variable '${name.lexeme}'`);
  }

  assign(name: Token, value: Value): void {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing !== null) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `undefined variable '${name.lexeme}'`);
  }

  define(name: string, value: Value): void {
    this.values.set(name, value);
  }
}
