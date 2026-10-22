import { Token } from "../parser/token.js";
import { RuntimeError } from "./exceptions.js";
import { UNIT, type Value } from "./runtime-types.js";

export class Environment {
  readonly enclosing: Environment | null;
  private readonly values = new Map<string, Value>();

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing ?? null;
  }

  ancestor(distance: number): Environment | null {
    if (distance === 0) {
      return this;
    } else {
      let environment = this.enclosing ?? null;
      for (let i = 1; i < distance; i++) {
        environment = environment?.enclosing ?? null;
      }
      return environment;
    }
  }

  get(name: Token): Value {
    if (this.values.has(name.lexeme))
      return this.values.get(name.lexeme) as Value;

    if (this.enclosing !== null) return this.enclosing.get(name);

    throw new RuntimeError(name, `undefined variable '${name.lexeme}'`);
  }

  getAt(distance: number, name: string): Value {
    const environment = this.ancestor(distance);
    if (environment !== null) return environment.values.get(name)!;
    // Unreachable
    return UNIT;
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

  assignAt(distance: number, name: Token, value: Value): void {
    const environment = this.ancestor(distance);
    if (environment !== null) environment.values.set(name.lexeme, value);
  }

  define(name: string, value: Value): void {
    this.values.set(name, value);
  }
}
