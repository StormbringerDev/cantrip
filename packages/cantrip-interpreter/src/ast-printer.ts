import type {
  BinaryExpr,
  Expr,
  ExprVisitor,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
} from "../../cantrip-ast/src/expr.js";

function getRawString(str: string): string {
  return JSON.stringify(str).slice(1, -1).replace(/\\\\/g, "\\");
}

export class AstPrinter implements ExprVisitor<string> {
  public print(expr: Expr): string {
    return expr.accept(this);
  }

  public visitBinaryExpr(expr: BinaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  public visitGroupingExpr(expr: GroupingExpr): string {
    return this.parenthesize("group", expr.expression);
  }

  public visitLiteralExpr(expr: LiteralExpr): string {
    if (expr.value === null) return "nil";
    if (typeof expr.value === "string") return getRawString(expr.value);
    if (typeof expr.value === "number" || typeof expr.value === "boolean")
      return expr.value.toString();
    return "";
  }

  public visitUnaryExpr(expr: UnaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  private parenthesize(name: string, ...exprs: Expr[]) {
    const builder: string[] = [];

    builder.push("(", name);
    for (const expr of exprs) {
      builder.push(" ");
      builder.push(expr.accept(this));
    }
    builder.push(")");

    return builder.join("");
  }
}
