import type {
  AssignExpr,
  BinaryExpr,
  BlockExpr,
  BlockStmt,
  BreakStmt,
  ContinueStmt,
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
  public interpret(ast: Stmt[]) {}

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

  public visitLiteralExpr(expr: LiteralExpr): RuntimeValue {
    return null;
  }

  public visitLoopExpr(expr: LoopExpr): RuntimeValue {
    return null;
  }

  public visitSetExpr(expr: SetExpr): RuntimeValue {
    return null;
  }

  public visitUnaryExpr(expr: UnaryExpr): RuntimeValue {
    return null;
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
}
