import { TokenType } from "@cantrip/ast";
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
  LetStmt,
  LiteralExpr,
  LoopExpr,
  SetExpr,
  Stmt,
  StmtVisitor,
  Token,
  UnaryExpr,
  VarExpr,
  WhileStmt,
} from "@cantrip/ast";

/** Primative and structured literals passed around at runtime. */
type RuntimeValue = number | string | boolean | null | RuntimeArray | RuntimeObject;

/** Runtime representation of a Cantrip array. */
type RuntimeArray = RuntimeValue[];

/** Runtime representation of a Cantrip object. */
type RuntimeObject = Map<string, RuntimeValue>;

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
   *
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

  public visitAssignExpr(expr: AssignExpr): RuntimeValue {
    return null;
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

  public visitBlockExpr(expr: BlockExpr): RuntimeValue {
    return null;
  }

  public visitGetExpr(expr: GetExpr): RuntimeValue {
    return null;
  }

  public visitGroupingExpr(expr: GroupingExpr): RuntimeValue {
    return this.evaluate(expr.expression);
  }

  public visitIfExpr(expr: IfExpr): RuntimeValue {
    return null;
  }

  public visitIndexExpr(expr: IndexExpr): RuntimeValue {
    return null;
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
        array.push(value.accept(this));
      }
      return array;
    }

    if (expr.value instanceof Map) {
      const object = new Map<string, RuntimeValue>();
      for (const [key, value] of expr.value) {
        object.set(key, value.accept(this));
      }
      return object;
    }

    return expr.value;
  }

  public visitLoopExpr(expr: LoopExpr): RuntimeValue {
    return null;
  }

  public visitSetExpr(expr: SetExpr): RuntimeValue {
    return null;
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

  public visitVarExpr(expr: VarExpr): RuntimeValue {
    return null;
  }

  public visitBlockStmt(stmt: BlockStmt): void {}

  public visitBreakStmt(stmt: BreakStmt): void {}

  public visitContinueStmt(stmt: ContinueStmt): void {}

  public visitExprStmt(stmt: ExprStmt): void {
    this.evaluate(stmt.expr);
  }

  public visitLetStmt(stmt: LetStmt): void {}

  public visitWhileStmt(stmt: WhileStmt): void {}

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
   * @param value - The value to be stringified.
   * @returns The value as a string, `"nil"` for `null`.
   */
  private stringify(value: RuntimeValue): string {
    if (value === null) return "nil";

    return value.toString();
  }

  /**
   * Reports a {@link RuntimeError}.
   *
   * @param error - The error to be reported.
   */
  private runtimeError(error: RuntimeError): void {
    console.error(
      `${error.name}: ${error.message}\n[line ${error.token.span.start.line}]`,
    );
  }
}
