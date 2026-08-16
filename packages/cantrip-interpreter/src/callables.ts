import type { BlockExpr, FunctionStmt } from "@cantrip/ast";
import { type Interpreter, type CantripValue, Return } from "./interpreter.js";
import { Environment } from "./environment.js";

/**
 * Interface for callable values in Cantrip.
 */
export interface CantripCallable {
  arity(): number;
  call(interpreter: Interpreter, args: CantripValue[]): CantripValue;
}

/**
 * Type guard for a class that implements {@link CantripCallable}.
 */
export function isCantripCallable(value: CantripValue): boolean {
  if (value === null) return false;
  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
    case "symbol":
      return false;
  }
  return (
    typeof (value as CantripCallable).arity === "function" &&
    typeof (value as CantripCallable).call === "function"
  );
}

/**
 * A runtime representation of a Cantrip function.
 */
export class CantripFunction implements CantripCallable {
  /** The declaration statement of the function. */
  private readonly declaration: FunctionStmt;
  /** The immediately enclosing environment. */
  private closure: Environment;

  /**
   * @param declaration - The function's declaration.
   * @param closure - The immediately enclosing environment.
   */
  constructor(declaration: FunctionStmt, closure: Environment) {
    this.declaration = declaration;
    this.closure = closure;
  }

  /**
   * @returns `"<fn name>"`
   */
  public toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`;
  }

  /**
   * @returns The length of the parameter list.
   */
  public arity(): number {
    return this.declaration.params.length;
  }

  /**
   * Evaluates the function body, produces any side effects, and returns
   * the result.
   *
   * @param interpreter - The main interpreter.
   * @param args - The values passed to the function.
   * @returns The result of evaluating the function body.
   */
  public call(interpreter: Interpreter, args: CantripValue[]): CantripValue {
    const environment = new Environment(this.closure);
    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].lexeme, args[i]);
    }

    let value: CantripValue;
    try {
      value = interpreter.executeBlock(
        (this.declaration.body as BlockExpr).statements.filter((s) => s !== null),
        (this.declaration.body as BlockExpr).value,
        environment,
      );
    } catch (err) {
      if (err instanceof Return) return err.value;
      else throw err;
    }
    return value;
  }
}

/** Type alias for a native function. */
type NativeFn = (args: CantripValue[]) => CantripValue;

/**
 * A function implemented in TypeScript and callable in Cantrip.
 */
export class CantripNative implements CantripCallable {
  /** The TypeScript function that Cantrip calls. */
  private readonly tsFunction: NativeFn;
  /** The arity of the function. */
  private readonly nativeArity: number;

  /**
   * @param tsFunction - The TypeScript function.
   * @param nativeArity - The number of parameters.
   */
  constructor(tsFunction: NativeFn, nativeArity: number) {
    this.tsFunction = tsFunction;
    this.nativeArity = nativeArity;
  }

  /**
   * @returns `"<native fn>"`
   */
  public toString(): string {
    return "<native fn>";
  }

  /**
   * @returns The native function's arity.
   */
  public arity(): number {
    return this.nativeArity;
  }

  /**
   * Executes the native function and returns its result
   * (unit type if native function normally returns `void`).
   *
   * @param _interpreter - An interpreter instance (not used).
   * @param args - The values passed to the function.
   * @returns The result of the native function.
   */
  public call(_interpreter: Interpreter, args: CantripValue[]): CantripValue {
    return this.tsFunction(args);
  }
}
