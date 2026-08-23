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
   * Retrieves a variable value if it exists in the immediate scope.
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
   * Assigns an existing variable in the immediate scope a new value.
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

  /**
   * Retrieves the enclosing variable at the given distance.
   *
   * @param distance - The distance of the target environment.
   * @returns - The enclosing environment at the distance.
   */
  public ancestor(distance: number): Environment {
    if (distance === 0) return this;
    return this.enclosing!.ancestor(distance - 1);
  }

  /**
   * Retrieves a variable value in an outer scope.
   *
   * @param distance - The environment where the target variable is located.
   * @param name - The name of the variable.
   * @returns - The value of the variable.
   */
  public getAt(distance: number, name: string): CantripValue {
    return this.ancestor(distance).values.get(name)!;
  }

  /**
   * Assigns an existing variable in an enclosing scope a new value.
   *
   * @param distance - The environment where the target variable is located.
   * @param name - The name token of the variable.
   * @param value - The value to assign.
   */
  public assignAt(distance: number, name: Token, value: CantripValue): void {
    this.ancestor(distance).values.set(name.lexeme, value);
  }
}
