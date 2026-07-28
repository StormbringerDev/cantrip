import type {
  BinaryExpr,
  Expr,
  ExprVisitor,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
} from "./expr.js";

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
    if (expr.value == null) return "nil";
    return expr.value.toString();
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
