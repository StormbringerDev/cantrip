import type { Span } from "@cantrip/types";
import type { Token } from "./token.js";

type CantripValue = number | string | boolean | null;
type CantripArray = Expr[];
type CantripObject = Map<string, Expr>;

export abstract class Expr {
  public readonly span: Span;

  constructor(span: Span) {
    this.span = span;
  }

  public abstract accept<R>(visitor: ExprVisitor<R>): R;
}

export interface ExprVisitor<R> {
  visitAssignExpr(expr: AssignExpr): R;
  visitBinaryExpr(expr: BinaryExpr): R;
  visitGetExpr(expr: GetExpr): R;
  visitGroupingExpr(expr: GroupingExpr): R;
  visitIndexExpr(expr: IndexExpr): R;
  visitLiteralExpr(expr: LiteralExpr): R;
  visitSetExpr(expr: SetExpr): R;
  visitUnaryExpr(expr: UnaryExpr): R;
  visitVarExpr(expr: VarExpr): R;
}

export class AssignExpr extends Expr {
  public readonly name: Token;
  public readonly operator: Token;
  public readonly value: Expr;

  constructor(name: Token, operator: Token, value: Expr, span: Span) {
    super(span);
    this.name = name;
    this.operator = operator;
    this.value = value;
  }

  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitAssignExpr(this);
  }
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

export class GetExpr extends Expr {
  public readonly object: Expr;
  public readonly name: Token;

  constructor(object: Expr, name: Token, span: Span) {
    super(span);
    this.object = object;
    this.name = name;
  }

  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGetExpr(this);
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

export class IndexExpr extends Expr {
  public readonly indexee: Expr;
  public readonly bracket: Token;
  public readonly index: Expr;

  constructor(indexee: Expr, bracket: Token, index: Expr, span: Span) {
    super(span);
    this.indexee = indexee;
    this.bracket = bracket;
    this.index = index;
  }

  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitIndexExpr(this);
  }
}

export class LiteralExpr extends Expr {
  public readonly value: CantripValue | CantripArray | CantripObject;

  constructor(value: CantripValue | CantripArray | CantripObject, span: Span) {
    super(span);
    this.value = value;
  }

  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
}

export class SetExpr extends Expr {
  public readonly object: Expr;
  public readonly name: Token;
  public readonly operator: Token;
  public readonly value: Expr;

  constructor(object: Expr, name: Token, operator: Token, value: Expr, span: Span) {
    super(span);
    this.object = object;
    this.name = name;
    this.operator = operator;
    this.value = value;
  }

  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitSetExpr(this);
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

export class VarExpr extends Expr {
  public readonly name: Token;

  constructor(name: Token, span: Span) {
    super(span);
    this.name = name;
  }

  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitVarExpr(this);
  }
}
