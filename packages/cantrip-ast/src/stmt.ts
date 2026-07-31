import type { Span } from "@cantrip/types";
import type { Expr } from "./expr.js";
import type { Token } from "./token.js";

export abstract class Stmt {
  public readonly span: Span;

  constructor(span: Span) {
    this.span = span;
  }

  public abstract accept<R>(visitor: StmtVisitor<R>): R;
}

export interface StmtVisitor<R> {
  visitExprStmt(stmt: ExprStmt): R;
  visitLetStmt(stmt: LetStmt): R;
}

export class ExprStmt extends Stmt {
  public readonly expr: Expr;

  constructor(expr: Expr, span: Span) {
    super(span);
    this.expr = expr;
  }

  public accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExprStmt(this);
  }
}

export class LetStmt extends Stmt {
  public readonly name: Token;
  public readonly initializer: Expr | null;

  constructor(name: Token, initializer: Expr | null, span: Span) {
    super(span);
    this.name = name;
    this.initializer = initializer;
  }

  public accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitLetStmt(this);
  }
}
