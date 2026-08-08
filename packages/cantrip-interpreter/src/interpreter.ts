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
  public interpret(statements: Stmt[]) {}

  public visitAssignExpr(expr: AssignExpr): RuntimeValue {
    return null;
  }

  public visitBinaryExpr(expr: BinaryExpr): RuntimeValue {
    return null;
  }

  public visitBlockExpr(expr: BlockExpr): RuntimeValue {
    return null;
  }

  public visitGetExpr(expr: GetExpr): RuntimeValue {
    return null;
  }

  public visitGroupingExpr(expr: GroupingExpr): RuntimeValue {
    return null;
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

  public visitExprStmt(stmt: ExprStmt): void {}

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
}
