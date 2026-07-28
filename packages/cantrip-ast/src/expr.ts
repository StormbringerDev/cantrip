import type { Span } from "@cantrip/types";
import type { Token } from "./token.js";

export abstract class Expr {
  public readonly span: Span;

  constructor(span: Span) {
    this.span = span;
  }

  public abstract accept<R>(visitor: ExprVisitor<R>): R;
}

export interface ExprVisitor<R> {
  visitBinaryExpr: (expr: BinaryExpr) => R;
  visitGroupingExpr: (expr: GroupingExpr) => R;
  visitLiteralExpr: (expr: LiteralExpr) => R;
  visitUnaryExpr: (expr: UnaryExpr) => R;
}

export class BinaryExpr extends Expr {
  public readonly left: Expr;
  public readonly operator: Token;
  public readonly right: Expr;

  constructor(left: Expr, operator: Token, right: Expr, span: Span) {
    super(span);
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  public accept<R>(visitor: ExprVisitor<R>) {
    return visitor.visitBinaryExpr(this);
  }
}

export class GroupingExpr extends Expr {
  public readonly expression: Expr;

  constructor(expression: Expr, span: Span) {
    super(span);
    this.expression = expression;
  }

  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGroupingExpr(this);
  }
}

export class LiteralExpr extends Expr {
  public readonly value: unknown;

  constructor(value: unknown, span: Span) {
    super(span);
    this.value = value;
  }

  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
}

export class UnaryExpr extends Expr {
  public readonly operator: Token;
  public readonly right: Expr;

  constructor(operator: Token, right: Expr, span: Span) {
    super(span);
    this.operator = operator;
    this.right = right;
  }

  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitUnaryExpr(this);
  }
}
