import type { Span } from "@cantrip/types";
import type { Expr } from "./expr.js";
import type { Token } from "./token.js";

/**
 * Base class for every statement node in the Cantrip AST.
 *
 * All concrete statement classes extend this and implement the
 * visitor pattern via {@link accept}.
 */
export abstract class Stmt {
  /** Source location of this statement. */
  public readonly span: Span;

  /**
   * @param span - Source span covering the entire statement.
   */
  constructor(span: Span) {
    this.span = span;
  }

  /**
   * Dispatch to the appropriate visitor method.
   *
   * @typeParam R - Return type of the visitor.
   * @param visitor - The visitor instance.
   * @returns The result of the corresponding `visit*` method.
   */
  public abstract accept<R>(visitor: StmtVisitor<R>): R;
}

/**
 * Visitor interface for traversing statement nodes.
 *
 * @typeParam R - The type returned by each visit method.
 */
export interface StmtVisitor<R> {
  visitBlockStmt(stmt: BlockStmt): R;
  visitExprStmt(stmt: ExprStmt): R;
  visitLetStmt(stmt: LetStmt): R;
}

/**
 * Block statement - a set of statements wrapped in curley braces (`{ ... }`)
 *
 * @example
 * ```cantrip
 * {
 *   let x = 42;
 * }
 * ```
 */
export class BlockStmt extends Stmt {
  /**
   * The list of contained statements.
   * `null` values are placeholders for where {@link ParseError}s occured.
   */
  public readonly statements: (Stmt | null)[];

  /**
   * @param statements - List of statements to run.
   * @param span - Source span of the entire block including braces.
   */
  constructor(statements: (Stmt | null)[], span: Span) {
    super(span);
    this.statements = statements;
  }

  /** @inheritdoc */
  public accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
}

/**
 * Expression statement - an expression used for its side effects.
 *
 * The expression is evaluated and its value is discarded.
 *
 * @example
 * ```cantrip
 * print(42);
 * player.move();
 * ```
 */
export class ExprStmt extends Stmt {
  /** The expression being executed. */
  public readonly expr: Expr;

  /**
   * @param expr - Expression to evaluate.
   * @param span - Source span of the statement (including any trailing semicolon).
   */
  constructor(expr: Expr, span: Span) {
    super(span);
    this.expr = expr;
  }

  /** @inheritdoc */
  public accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExprStmt(this);
  }
}

/**
 * Variable declaration: `let name = initializer` or `let name`.
 *
 * When `initializer` is `null` the variable is declared but not
 * initialized (its value will be `nil` at runtime).
 *
 * @example
 * ```cantrip
 * let x = 10
 * let flag
 * ```
 */
export class LetStmt extends Stmt {
  /** Name of the variable being declared. */
  public readonly name: Token;
  /**
   * Optional initializer expression.
   * `null` means the variable is declared without an initial value.
   */
  public readonly initializer: Expr | null;

  /**
   * @param name - Identifier of the new variable.
   * @param initializer - Expression providing the initial value, or `null`.
   * @param span - Source span of the whole `let` statement.
   */
  constructor(name: Token, initializer: Expr | null, span: Span) {
    super(span);
    this.name = name;
    this.initializer = initializer;
  }

  /** @inheritdoc */
  public accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitLetStmt(this);
  }
}
