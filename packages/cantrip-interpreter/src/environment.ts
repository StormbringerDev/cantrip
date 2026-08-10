import type { Token } from "@cantrip/ast";
import { RuntimeError, type RuntimeValue } from "./interpreter.js";

/**
 * An environment containing any variables and functions
 * declared in the current and outer scopes.
 */
export class Environment {
  /** The variables and functions bound by identifier. */
  private values = new Map<string, RuntimeValue>();

  /**
   * Retrieves a variable value if it exists in the environment.
   *
   * @param name - The variable identifier token.
   * @returns The value associated with the name.
   * @throws {RuntimeError} if the name is not in the environment.
   */
  public get(name: Token): RuntimeValue {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme)!;
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  /**
   * Assigns an existing variable a new value.
   *
   * @param name - The variable identifier token.
   * @param value - The value being assigned.
   * @throws {RuntimeError} if the name is not in the environment.
   */
  public assign(name: Token, value: RuntimeValue): void {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
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
  public define(name: string, value: RuntimeValue): void {
    this.values.set(name, value);
  }
}
