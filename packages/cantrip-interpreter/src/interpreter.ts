import { TokenType, VarExpr } from "@cantrip/ast";
import type {
  AssignExpr,
  BinaryExpr,
  BlockExpr,
  BlockStmt,
  BreakStmt,
  ContinueStmt,
  Expr,
  ExprStmt,
  ExprVisitor,
  GetExpr,
  GroupingExpr,
  IfExpr,
  IndexExpr,
  IndexSetExpr,
  LetStmt,
  LiteralExpr,
  LoopExpr,
  MatchExpr,
  SetExpr,
  Stmt,
  StmtVisitor,
  Token,
  UnaryExpr,
  WhileStmt,
} from "@cantrip/ast";
import { Environment } from "./environment.js";

/** Primative and structured literals passed around at runtime. */
export type RuntimeValue =
  number | string | boolean | null | RuntimeArray | RuntimeObject;

/** Runtime representation of a Cantrip array. */
export type RuntimeArray = RuntimeValue[];

/** Runtime representation of a Cantrip object. */
export type RuntimeObject = Map<string, RuntimeValue>;

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
export class Interpreter implements ExprVisitor<RuntimeValue>, StmtVisitor<void> {
  /** The variable environment currently in scope. */
  private environment = new Environment();

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
  public visitAssignExpr(expr: AssignExpr): RuntimeValue {
    let value = this.evaluate(expr.value);

    switch (expr.operator.type) {
      case TokenType.Eq:
        break; // Continue as normal.
      case TokenType.MinusEq:
        value = (this.environment.get(expr.name) as number) - (value as number);
        break;
      case TokenType.PlusEq:
        value = this.environment.get(expr.name) + value;
        break;
      case TokenType.SlashEq:
        value = (this.environment.get(expr.name) as number) / (value as number);
        break;
      case TokenType.StarEq:
        value = (this.environment.get(expr.name) as number) * (value as number);
        break;
      case TokenType.PercentEq:
        value = (this.environment.get(expr.name) as number) % (value as number);
        break;
    }

    this.environment.assign(expr.name, value);
    return value;
  }

  /**
   * Evaluates a binary expression (`+`, `-`, `*`, `/`, `%`, etc.).
   *
   * @param expr - The binary expression to be evaluated.
   * @returns The result of the expression.
   */
  public visitBinaryExpr(expr: BinaryExpr): RuntimeValue {
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
        return (left as number) > (right as number);
      case TokenType.GreaterEq:
        return (left as number) >= (right as number);
      case TokenType.Less:
        return (left as number) < (right as number);
      case TokenType.LessEq:
        return (left as number) <= (right as number);
      case TokenType.Percent:
        return (left as number) % (right as number);
      case TokenType.Slash:
        return (left as number) / (right as number);
      case TokenType.Star:
        return (left as number) * (right as number);
      case TokenType.Minus:
        return (left as number) - (right as number);
      case TokenType.Plus:
        if (typeof left === "string" || typeof right === "string")
          return this.stringify(left) + this.stringify(right);
        return (left as number) + (right as number);
    }

    return null; // Unreachable.
  }

  /**
   * Evaluates a block expression (`{ ... }`).
   *
   * @param expr - The block expression to be evaluated.
   * @returns The block's value expression result or `null`.
   */
  public visitBlockExpr(expr: BlockExpr): RuntimeValue {
    const statements = expr.statements.filter((s) => s !== null);
    return this.executeBlock(statements, expr.value, new Environment(this.environment));
  }

  /**
   * Evaluates a get expression (`object.field`).
   *
   * @param expr - The get expression to be evaluated.
   * @returns - The value of the target field.
   */
  public visitGetExpr(expr: GetExpr): RuntimeValue {
    const object = this.evaluate(expr.object);
    if (object instanceof Map) {
      return object.get(expr.name.lexeme)!;
    }

    throw new RuntimeError(expr.name, "Property not found.");
  }

  /**
   * Evaluates an expression grouped by parentheses (`(expr)`).
   *
   * @param expr - The grouping expression to be evaluated.
   * @returns The result of the expression.
   */
  public visitGroupingExpr(expr: GroupingExpr): RuntimeValue {
    return this.evaluate(expr.expression);
  }

  /**
   * Evaluates an if expression.
   *
   * @param expr - The if expression to be evaluated.
   * @returns The result of the chosen branch.
   */
  public visitIfExpr(expr: IfExpr): RuntimeValue {
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
  public visitIndexExpr(expr: IndexExpr): RuntimeValue {
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
  public visitIndexSetExpr(expr: IndexSetExpr): RuntimeValue {
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
  public visitLiteralExpr(expr: LiteralExpr): RuntimeValue {
    if (Array.isArray(expr.value)) {
      const array = [];
      for (const value of expr.value) {
        array.push(this.evaluate(value));
      }
      return array;
    }

    if (expr.value instanceof Map) {
      const object = new Map<string, RuntimeValue>();
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
  public visitLoopExpr(expr: LoopExpr): RuntimeValue {
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
  public visitMatchExpr(expr: MatchExpr): RuntimeValue {
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

    return null;
  }

  /**
   * Evaluates a set expression (`object.field = value`).
   *
   * @param expr - The set expression to be evaluated.
   * @returns The value assigned to the target object field.
   */
  public visitSetExpr(expr: SetExpr): RuntimeValue {
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
  public visitUnaryExpr(expr: UnaryExpr): RuntimeValue {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.Bang:
        return !this.isTruthy(right);
      case TokenType.Minus:
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
  public visitVarExpr(expr: VarExpr): RuntimeValue {
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
   */
  public visitBreakStmt(stmt: BreakStmt): void {
    let value = null;
    if (stmt.value !== null) value = this.evaluate(stmt.value);

    throw new Break(value);
  }

  /**
   * Executes a continue statement.
   *
   * @param _stmt - The continue statement to be executed.
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
   * Executes a variable declaration and adds it to the current
   * environment.
   *
   * @param stmt - The variable declaration statement.
   */
  public visitLetStmt(stmt: LetStmt): void {
    let value: RuntimeValue | null = null;
    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.lexeme, value);
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
  private evaluate(expr: Expr): RuntimeValue {
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
  private executeBlock(
    statements: Stmt[],
    value: Expr | null,
    environment: Environment,
  ): RuntimeValue {
    const previous = this.environment;
    let blockValue: RuntimeValue = null;
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
   * Checks if a value is truthy.
   *
   * @param value - The value to be tested for truthiness.
   * @returns `false` for `nil` and `false`, `true` for everything else.
   */
  private isTruthy(value: RuntimeValue): boolean {
    if (value === null) return false;
    if (typeof value === "boolean") return value;
    return true;
  }

  /**
   * Converts a value into a string.
   *
   * @param cantripValue - The value to be stringified.
   * @returns The value as a string, `"nil"` for `null`.
   */
  private stringify(cantripValue: RuntimeValue): string {
    if (cantripValue === null) return "nil";

    if (Array.isArray(cantripValue)) {
      const builder: string[] = [];
      for (const element of cantripValue) {
        builder.push(this.stringify(element));
      }
      return `[${builder.join(", ")}]`;
    }

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
  public readonly value: RuntimeValue;

  constructor(value: RuntimeValue) {
    super();
    this.value = value;
  }
}
/**
 * A special error to bypass Node's call stack for loops.
 */
export class Continue extends Error {}
