import type { Token } from "@cantrip/ast";
import { RuntimeError, type CantripValue } from "./interpreter.js";

/**
 * An environment containing any variables and functions
 * declared in the current and outer scopes.
 */
export class Environment {
  /** The enclosing environment */
  public readonly enclosing: Environment | null;
  /** The variables and functions bound by identifier. */
  private values = new Map<string, CantripValue>();

  /**
   * @param enclosing - The environment that encloses the new one.
   */
  constructor(enclosing: Environment | null = null) {
    this.enclosing = enclosing;
  }

  /**
   * Retrieves a variable value if it exists in the environment.
   *
   * @param name - The variable identifier token.
   * @returns The value associated with the name.
   * @throws {RuntimeError} if the name is not in the environment.
   */
  public get(name: Token): CantripValue {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme)!;
    }

    if (this.enclosing !== null) return this.enclosing.get(name);

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  /**
   * Assigns an existing variable a new value.
   *
   * @param name - The variable identifier token.
   * @param value - The value being assigned.
   * @throws {RuntimeError} if the name is not in the environment.
   */
  public assign(name: Token, value: CantripValue): void {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing !== null) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  /**
   * Defines a new variable regardless of if it exists in the
   * environment or not.
   *
   * @param name - The name of the variable to be defined.
   * @param value - The value of the variable.
   */
  public define(name: string, value: CantripValue): void {
    this.values.set(name, value);
  }
}
