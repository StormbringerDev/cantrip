import { TokenType } from "@cantrip/ast";
import type {
  LetStmt,
  Stmt,
  StmtVisitor,
  AssignExpr,
  BinaryExpr,
  BlockExpr,
  BlockStmt,
  Expr,
  ExprStmt,
  ExprVisitor,
  GetExpr,
  GroupingExpr,
  IndexExpr,
  LiteralExpr,
  SetExpr,
  UnaryExpr,
  VarExpr,
} from "@cantrip/ast";

function getRawString(str: string): string {
  return JSON.stringify(str).slice(1, -1).replace(/\\\\/g, "\\");
}

export class AstPrinter implements ExprVisitor<string>, StmtVisitor<string> {
  private indentationLevel = 0;

  public print(stmts: (Stmt | null)[]): string {
    const program: string[] = [];
    for (const stmt of stmts) {
      if (stmt) program.push(`${stmt.accept(this)}`);
    }
    return program.join("\n");
  }

  public visitAssignExpr(expr: AssignExpr): string {
    let operation = "assign";
    switch (expr.operator.type) {
      case TokenType.PlusEq:
        operation = "addAssign";
        break;
      case TokenType.MinusEq:
        operation = "subAssign";
        break;
      case TokenType.StarEq:
        operation = "mulAssign";
        break;
      case TokenType.SlashEq:
        operation = "divAssign";
        break;
      case TokenType.PercentEq:
        operation = "modAssign";
        break;
    }
    return this.parenthesize(`${operation} ${expr.name.lexeme}`, expr.value);
  }

  public visitBinaryExpr(expr: BinaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  public visitBlockExpr(expr: BlockExpr): string {
    const validStmts = expr.statements.filter((s) => s !== null);
    return this.block(validStmts);
  }

  public visitGetExpr(expr: GetExpr): string {
    return `${expr.object.accept(this)}.${expr.name.lexeme}`;
  }

  public visitGroupingExpr(expr: GroupingExpr): string {
    return this.parenthesize("group", expr.expression);
  }

  public visitIndexExpr(expr: IndexExpr): string {
    return this.parenthesize(`index`, expr.indexee, expr.index);
  }

  public visitLiteralExpr(expr: LiteralExpr): string {
    if (expr.value === null) return "nil";
    if (typeof expr.value === "string") return `"${getRawString(expr.value)}"`;
    if (typeof expr.value === "number" || typeof expr.value === "boolean")
      return expr.value.toString();
    if (Array.isArray(expr.value)) return this.array(expr.value);
    if (expr.value instanceof Map) return this.object(expr.value);
    return "";
  }

  private array(elements: Expr[]): string {
    const stringifiedElements: string[] = [];
    for (const element of elements) stringifiedElements.push(element.accept(this));
    return `[${stringifiedElements.join(", ")}]`;
  }

  private object(fields: Map<string, Expr>): string {
    const stringifiedFields: string[] = [];
    for (const [key, value] of fields)
      stringifiedFields.push(`${key}: ${value.accept(this)}`);
    return `{ ${stringifiedFields.join(", ")} }`;
  }

  public visitSetExpr(expr: SetExpr): string {
    let operation = "assign";
    switch (expr.operator.type) {
      case TokenType.PlusEq:
        operation = "addAssign";
        break;
      case TokenType.MinusEq:
        operation = "subAssign";
        break;
      case TokenType.StarEq:
        operation = "mulAssign";
        break;
      case TokenType.SlashEq:
        operation = "divAssign";
        break;
      case TokenType.PercentEq:
        operation = "modAssign";
        break;
    }
    return this.parenthesize(
      `${operation} ${expr.object.accept(this)}.${expr.name.lexeme}`,
      expr.value,
    );
  }

  public visitUnaryExpr(expr: UnaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  public visitVarExpr(expr: VarExpr): string {
    return expr.name.lexeme;
  }

  public visitBlockStmt(stmt: BlockStmt): string {
    const validStmts = stmt.statements.filter((s) => s !== null);
    return this.block(validStmts);
  }

  public visitExprStmt(stmt: ExprStmt): string {
    return stmt.expr.accept(this);
  }

  public visitLetStmt(stmt: LetStmt): string {
    if (stmt.initializer)
      return this.parenthesize(`let ${stmt.name.lexeme}`, stmt.initializer);
    return this.parenthesize(`let ${stmt.name.lexeme}`);
  }

  private parenthesize(name: string, ...exprs: Expr[]): string {
    const builder: string[] = [];

    builder.push("(", name);
    for (const expr of exprs) {
      builder.push(" ");
      builder.push(expr.accept(this));
    }
    builder.push(")");

    return builder.join("");
  }

  private block(stmts: Stmt[]): string {
    this.indentationLevel++;
    const builder: string[] = [];

    builder.push("{\n");
    for (const stmt of stmts) {
      for (let i = 0; i < this.indentationLevel; i++) builder.push("  ");
      builder.push(stmt.accept(this), "\n");
    }
    this.indentationLevel--;
    for (let i = 0; i < this.indentationLevel; i++) builder.push("  ");
    builder.push("}");

    return builder.join("");
  }
}
