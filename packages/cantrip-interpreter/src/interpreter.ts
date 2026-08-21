import { TokenType, VarExpr } from "@cantrip/ast";
import type {
  AssignExpr,
  BinaryExpr,
  BlockExpr,
  BlockStmt,
  BreakStmt,
  CallExpr,
  ContinueStmt,
  Expr,
  ExprStmt,
  ExprVisitor,
  FunctionStmt,
  GetExpr,
  GroupingExpr,
  IfExpr,
  IndexExpr,
  IndexSetExpr,
  LetStmt,
  LiteralExpr,
  LoopExpr,
  MatchExpr,
  ReturnStmt,
  SetExpr,
  Stmt,
  StmtVisitor,
  Token,
  UnaryExpr,
  WhileStmt,
} from "@cantrip/ast";
import { Environment } from "./environment.js";
import {
  type CantripCallable,
  CantripFunction,
  CantripNative,
  isCantripCallable,
} from "./callables.js";

/** Primative and structured literals passed around at runtime. */
export type CantripValue =
  | number
  | string
  | boolean
  | null
  | CantripArray
  | CantripObject
  | CantripFunction
  | CantripNative
  | UnitType;

/** Runtime representation of a Cantrip array. */
export type CantripArray = CantripValue[];

/** Runtime representation of a Cantrip object. */
export type CantripObject = Map<string, CantripValue>;

/** Unit type for functions that do not return a meaningful value. */
export const Unit = Symbol.for("cantrip.unit");
/** Type alias for unit type. */
export type UnitType = typeof Unit;

/**
 * Error thrown by interpreter functions and caught by the interpreter.
 *
 * Unlike {@link ParseError}s, runtime errors abort the execution of the
 * interpreter.
 */
export class RuntimeError extends Error {
  /** The token at which the error was detected. */
  public readonly token: Token;

  /**
   * @param token - The token that triggered the error.
   * @param message - Human-readable description of the problem.
   */
  constructor(token: Token, message: string) {
    super(message);
    this.name = "RuntimeError";
    this.token = token;
  }
}

/**
 * Tree-walking interpreter for Cantrip.
 *
 * Takes in the abstract syntax tree provided by the parser and
 * executes each statement in order.
 *
 * The interpreter is designed for rapid iteration and not performance.
 * Its semantics will inform the bytecode interpreter and later JIT
 * compilation.
 */
export class Interpreter implements ExprVisitor<CantripValue>, StmtVisitor<void> {
  /** The global environment where stdlib functions are defined. */
  public readonly globals = new Environment();
  /** The variable environment currently in scope. */
  private environment = this.globals;

  constructor() {
    this.globals.define(
      "print",
      new CantripNative((args) => {
        console.log(this.stringify(args[0]));
        return Unit;
      }, 1),
    );
    this.globals.define("time", new CantripNative((_args) => Date.now(), 0));
  }

  /**
   * Executes statements one by one until the end of the array.
   *
   * @param statements - The array of statements to be executed.
   */
  public interpret(statements: Stmt[]) {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (err) {
      this.runtimeError(err as RuntimeError);
    }
  }

  /**
   * Evaluates an assignment expression (`x = 42`).
   *
   * @param expr - The assignment expression to be evaluated.
   * @returns The value being assigned.
   */
  public visitAssignExpr(expr: AssignExpr): CantripValue {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name, value);
    return value;
  }

  /**
   * Evaluates a binary expression (`+`, `-`, `*`, `/`, `%`, etc.).
   *
   * @param expr - The binary expression to be evaluated.
   * @returns The result of the expression.
   */
  public visitBinaryExpr(expr: BinaryExpr): CantripValue {
    const left = this.evaluate(expr.left);

    if (expr.operator.type === TokenType.Or) {
      if (this.isTruthy(left)) return left;
      return this.evaluate(expr.right);
    } else if (expr.operator.type === TokenType.And) {
      if (!this.isTruthy(left)) return left;
      return this.evaluate(expr.right);
    }

    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BangEq:
        return left !== right;
      case TokenType.EqEq:
        return left === right;
      case TokenType.Greater:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) > (right as number);
      case TokenType.GreaterEq:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) >= (right as number);
      case TokenType.Less:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) < (right as number);
      case TokenType.LessEq:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) <= (right as number);
      case TokenType.Percent:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) % (right as number);
      case TokenType.Slash:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) / (right as number);
      case TokenType.Star:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) * (right as number);
      case TokenType.Minus:
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) - (right as number);
      case TokenType.Plus:
        if (typeof left === "string" || typeof right === "string")
          return this.stringify(left) + this.stringify(right);
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) + (right as number);
    }

    return Unit; // Unreachable.
  }

  /**
   * Evaluates a block expression (`{ ... }`).
   *
   * @param expr - The block expression to be evaluated.
   * @returns The block's value expression result or `Unit`.
   */
  public visitBlockExpr(expr: BlockExpr): CantripValue {
    const statements = expr.statements.filter((s) => s !== null);
    return this.executeBlock(statements, expr.value, new Environment(this.environment));
  }

  /**
   * Evaluates a call expression (`function(args)`).
   *
   * @param expr - The call expression to be evaluated.
   * @returns The return value of the function's body.
   */
  public visitCallExpr(expr: CallExpr): CantripValue {
    const callee = this.evaluate(expr.callee);

    const args: CantripValue[] = [];
    for (const arg of expr.args) {
      args.push(this.evaluate(arg));
    }

    if (!isCantripCallable(callee)) {
      throw new RuntimeError(expr.paren, "Can only call functions.");
    }

    const func = callee as CantripCallable;
    if (args.length !== func.arity()) {
      throw new RuntimeError(
        expr.paren,
        `Expected ${func.arity()} arguments but got ${args.length}.`,
      );
    }
    return func.call(this, args);
  }

  /**
   * Evaluates a get expression (`object.field`).
   *
   * @param expr - The get expression to be evaluated.
   * @returns - The value of the target field.
   */
  public visitGetExpr(expr: GetExpr): CantripValue {
    const object = this.evaluate(expr.object);
    if (object instanceof Map) {
      const value = object.get(expr.name.lexeme);
      if (value !== undefined) return value;
    }

    throw new RuntimeError(expr.name, "Property not found.");
  }

  /**
   * Evaluates an expression grouped by parentheses (`(expr)`).
   *
   * @param expr - The grouping expression to be evaluated.
   * @returns The result of the expression.
   */
  public visitGroupingExpr(expr: GroupingExpr): CantripValue {
    return this.evaluate(expr.expression);
  }

  /**
   * Evaluates an if expression.
   *
   * @param expr - The if expression to be evaluated.
   * @returns The result of the chosen branch.
   */
  public visitIfExpr(expr: IfExpr): CantripValue {
    if (this.isTruthy(this.evaluate(expr.condition))) {
      return this.evaluate(expr.thenBranch);
    } else if (expr.elseBranch !== null) {
      return this.evaluate(expr.elseBranch);
    }
    return null;
  }

  /**
   * Evaluates an index expression.
   *
   * @param expr - The index expression to be evaluated.
   * @returns The array element at the given index.
   */
  public visitIndexExpr(expr: IndexExpr): CantripValue {
    const indexee = this.evaluate(expr.indexee);

    if (Array.isArray(indexee)) {
      const index = this.evaluate(expr.index);
      if (typeof index !== "number") {
        throw new RuntimeError(expr.bracket, "Index must evaluate to a number.");
      }
      const value = indexee.at(index);

      if (value === undefined) {
        throw new RuntimeError(expr.bracket, "Array index out of bounds.");
      }

      return value;
    }

    if (indexee instanceof Map) {
      const index = this.evaluate(expr.index);
      if (typeof index !== "string") {
        throw new RuntimeError(expr.bracket, "Index must evaluate to a string.");
      }
      const value = indexee.get(index);

      if (value === undefined) {
        throw new RuntimeError(expr.bracket, "Object does not contain key.");
      }

      return value;
    }

    throw new RuntimeError(expr.bracket, "Cannot index into a non-structured value.");
  }

  /**
   * Evaluates an index set expression.
   *
   * @param expr - The index set expression to be evaluated.
   * @returns The value assigned to the structure index.
   */
  public visitIndexSetExpr(expr: IndexSetExpr): CantripValue {
    const indexee = this.evaluate(expr.indexee);

    if (Array.isArray(indexee)) {
      const index = this.evaluate(expr.index);
      if (typeof index !== "number") {
        throw new RuntimeError(expr.bracket, "Index must evaluate to a number.");
      }

      const value = this.evaluate(expr.value);
      indexee[index] = value;
      return value;
    }

    if (indexee instanceof Map) {
      const index = this.evaluate(expr.index);
      if (typeof index !== "string") {
        throw new RuntimeError(expr.bracket, "Index must evaluate to a string.");
      }

      const value = this.evaluate(expr.value);
      indexee.set(index, value);
      return value;
    }

    throw new RuntimeError(expr.bracket, "Cannot index into a non-structured value.");
  }

  /**
   * Evaluates a literal expression (number, string, boolean, `nil`,
   * arrays, and objects).
   *
   * @param expr - The literal expression to be evaluated.
   * @returns The result of the expression.
   */
  public visitLiteralExpr(expr: LiteralExpr): CantripValue {
    if (Array.isArray(expr.value)) {
      const array = [];
      for (const value of expr.value) {
        array.push(this.evaluate(value));
      }
      return array;
    }

    if (expr.value instanceof Map) {
      const object = new Map<string, CantripValue>();
      for (const [key, value] of expr.value) {
        object.set(key, this.evaluate(value));
      }
      return object;
    }

    return expr.value;
  }

  /**
   * Evaluates a loop expression.
   *
   * @param expr - The loop expression to be evaluated.
   * @returns `null` until value-carrying break is implemented.
   */
  public visitLoopExpr(expr: LoopExpr): CantripValue {
    while (true) {
      try {
        this.evaluate(expr.body);
      } catch (err) {
        if (err instanceof Break) return err.value;
        else if (err instanceof Continue) continue;
        else throw err;
      }
    }
  }

  /**
   * Evaluates a match expression.
   *
   * @param expr - The match expression to be evaluated.
   * @returns The expression result of the chosen branch.
   */
  public visitMatchExpr(expr: MatchExpr): CantripValue {
    const matcher = this.evaluate(expr.matcher);
    for (const [key, value] of expr.branches) {
      // Check for underscore
      if (key instanceof VarExpr && key.name.lexeme === "_") {
        return this.evaluate(value);
      }

      const branch = this.evaluate(key);
      if (branch === matcher) {
        return this.evaluate(value);
      }
    }

    return Unit;
  }

  /**
   * Evaluates a set expression (`object.field = value`).
   *
   * @param expr - The set expression to be evaluated.
   * @returns The value assigned to the target object field.
   */
  public visitSetExpr(expr: SetExpr): CantripValue {
    const object = this.evaluate(expr.object);

    if (!(object instanceof Map)) {
      throw new RuntimeError(expr.name, "Only object values have fields.");
    }

    const value = this.evaluate(expr.value);
    object.set(expr.name.lexeme, value);
    return value;
  }

  /**
   * Evaluates a unary expression (`!`, `-`).
   *
   * @param expr - The unary expression to be evaluated.
   * @returns The result of the expression.
   */
  public visitUnaryExpr(expr: UnaryExpr): CantripValue {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.Bang:
        return !this.isTruthy(right);
      case TokenType.Minus:
        this.checkNumberOperand(expr.operator, right);
        return -(right as number);
    }

    return null; // Unreachable
  }

  /**
   * Evaluates a variable expression and returns its value if present
   * in the current scope.
   *
   * @param expr - The variable expression to be evaluated.
   * @returns The value of the variable if it exists in scope.
   */
  public visitVarExpr(expr: VarExpr): CantripValue {
    return this.environment.get(expr.name);
  }

  /**
   * Executes a block statement (`{ ... }`).
   *
   * @param expr - The block statement to be executed.
   */
  public visitBlockStmt(stmt: BlockStmt): void {
    const statements = stmt.statements.filter((s) => s !== null);
    this.executeBlock(statements, null, new Environment(this.environment));
  }

  /**
   * Executes a break statement.
   *
   * @param stmt - The break statement to be executed.
   * @throws {Break} with a value payload that is caught by {@link visitLoopExpr}.
   */
  public visitBreakStmt(stmt: BreakStmt): void {
    let value: CantripValue = Unit;
    if (stmt.value !== null) value = this.evaluate(stmt.value);

    throw new Break(value);
  }

  /**
   * Executes a continue statement.
   *
   * @param _stmt - The continue statement to be executed.
   * @throws {Continue} which is caught by {@link visitLoopExpr} or {@link visitWhileStmt}.
   */
  public visitContinueStmt(_stmt: ContinueStmt): void {
    throw new Continue();
  }

  /**
   * Evaluates the expression, produces applicable side effects
   * and discards the expression result.
   *
   * @param stmt - The statement to be executed.
   */
  public visitExprStmt(stmt: ExprStmt): void {
    this.evaluate(stmt.expr);
  }

  /**
   * Executes a function declaration and adds it to the current
   * environment.
   *
   * @param stmt - The function declaration statement.
   */
  public visitFunctionStmt(stmt: FunctionStmt): void {
    const func = new CantripFunction(stmt, this.environment);
    this.environment.define(stmt.name.lexeme, func);
  }

  /**
   * Executes a variable declaration and adds it to the current
   * environment.
   *
   * @param stmt - The variable declaration statement.
   */
  public visitLetStmt(stmt: LetStmt): void {
    let value: CantripValue = null;
    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.lexeme, value);
  }

  /**
   * Executes a return statement.
   *
   * @param stmt - The return statement to be executed.
   * @throws {Return} with a value payload that is caught by `CantripFunction.call`.
   */
  public visitReturnStmt(stmt: ReturnStmt): void {
    let value: CantripValue = Unit;
    if (stmt.value !== null) {
      value = this.evaluate(stmt.value);
    }

    throw new Return(value);
  }

  /**
   * Executes a while loop.
   *
   * @param stmt - The while loop to be executed.
   */
  public visitWhileStmt(stmt: WhileStmt): void {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      try {
        this.execute(stmt.body);
      } catch (err) {
        if (err instanceof Break) break;
        else if (err instanceof Continue) continue;
        else throw err;
      }
    }
  }

  /**
   * Evaluates the given expression and returns the result.
   *
   * @param expr - The expression to be evaluated.
   * @returns The result of the given expression.
   */
  private evaluate(expr: Expr): CantripValue | typeof Unit {
    return expr.accept(this);
  }

  /**
   * Executes the given statement.
   *
   * @param stmt - The statement to be executed.
   */
  private execute(stmt: Stmt): void {
    stmt.accept(this);
  }

  /**
   * Executes a block with a new scope.
   *
   * @param statements - The statements inside the block.
   * @param value - The value of the block.
   * @param environment - The new environment.
   */
  public executeBlock(
    statements: Stmt[],
    value: Expr | null,
    environment: Environment,
  ): CantripValue {
    const previous = this.environment;
    let blockValue: CantripValue = Unit;
    try {
      this.environment = environment;

      for (const statement of statements) {
        this.execute(statement);
      }

      if (value !== null) blockValue = this.evaluate(value);
    } finally {
      this.environment = previous;
    }

    return blockValue;
  }

  /**
   * Checks if a single operand is a number.
   *
   * @param operator - The operator of the unary expression.
   * @param operand - The operand of the unary expression.
   * @throws {RuntimeError} if the operand is not a number.
   */
  private checkNumberOperand(operator: Token, operand: CantripValue): void {
    if (typeof operand === "number") return;
    throw new RuntimeError(operator, "Operand must be a number.");
  }

  /**
   * Checks if two operands are both numbers.
   *
   * @param operator - The operator of the binary expression.
   * @param left - The left value of the binary expression.
   * @param right - The right value of the binary expression.
   * @throws {RuntimeError} if either operand is not a number.
   */
  private checkNumberOperands(
    operator: Token,
    left: CantripValue,
    right: CantripValue,
  ): void {
    if (typeof left === "number" && typeof right === "number") return;
    throw new RuntimeError(operator, "Operands must be numbers.");
  }

  /**
   * Checks if a value is truthy.
   *
   * @param value - The value to be tested for truthiness.
   * @returns `false` for `nil` and `false`, `true` for everything else.
   */
  private isTruthy(value: CantripValue): boolean {
    if (value === null) return false;
    if (value === Unit) return false;
    if (typeof value === "boolean") return value;
    return true;
  }

  /**
   * Converts a value into a string.
   *
   * @param cantripValue - The value to be stringified.
   * @returns The value as a string, `"nil"` for `null`.
   */
  private stringify(cantripValue: CantripValue): string {
    if (cantripValue === null) return "nil";

    if (Array.isArray(cantripValue)) {
      const builder: string[] = [];
      for (const element of cantripValue) {
        builder.push(this.stringify(element));
      }
      return `[${builder.join(", ")}]`;
    }

    if (cantripValue === Unit) return "()";

    if (cantripValue instanceof Map) {
      const builder: string[] = [];
      for (const [key, value] of cantripValue) {
        builder.push(`${key}: ${this.stringify(value)}`);
      }
      return `{ ${builder.join(", ")} }`;
    }

    return cantripValue.toString();
  }

  /**
   * Reports a {@link RuntimeError}.
   *
   * @param error - The error to be reported.
   */
  private runtimeError(error: RuntimeError): void {
    console.error(`${error.message}\n[line ${error.token.span.start.line}]`);
  }
}

/**
 * A special error to bypass Node's call stack for loops.
 *
 * Carries a value as a payload.
 */
export class Break extends Error {
  /** The value payload. */
  public readonly value: CantripValue;

  /**
   * @param value - The value payload to return.
   */
  constructor(value: CantripValue) {
    super();
    this.value = value;
  }
}

/**
 * A special error to bypass Node's call stack for loops.
 */
export class Continue extends Error {}

/**
 * A special error to bypass Node's call stack for functions.
 *
 * Carries a value as a payload.
 */
export class Return extends Error {
  /** The value payload. */
  public readonly value: CantripValue;

  /**
   * @param value - The value payload to return.
   */
  constructor(value: CantripValue) {
    super();
    this.value = value;
  }
}
