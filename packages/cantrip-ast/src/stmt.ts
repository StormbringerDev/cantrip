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
  visitBreakStmt(stmt: BreakStmt): R;
  visitContinueStmt(stmt: ContinueStmt): R;
  visitExprStmt(stmt: ExprStmt): R;
  visitFunctionStmt(stmt: FunctionStmt): R;
  visitLetStmt(stmt: LetStmt): R;
  visitReturnStmt(stmt: ReturnStmt): R;
  visitWhileStmt(stmt: WhileStmt): R;
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
 * Break statement - a statement to exit out of the current loop.
 *
 * In future versions, the break statement will allow the `loop` statement
 * to return a value.
 *
 * @example
 * ```cantrip
 * loop {
 *   break;
 * }
 * ```
 */
export class BreakStmt extends Stmt {
  /** The `break` keyword. Used for static analysis errors. */
  public readonly keyword: Token;
  /** Optional value expression to return from a {@link LoopExpr}. */
  public readonly value: Expr | null;

  /**
   * @param keyword - The `break` keyword.
   * @param span - The source span of the entire statement.
   */
  constructor(keyword: Token, value: Expr | null, span: Span) {
    super(span);
    this.keyword = keyword;
    this.value = value;
  }

  /** @inheritdoc */
  public accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBreakStmt(this);
  }
}

/**
 * Continue statement - a statement to skip the current loop run and start
 * the next.
 *
 * @example
 * ```cantrip
 * loop {
 *   continue;
 * }
 * ```
 */
export class ContinueStmt extends Stmt {
  /** The `continue` keyword. Used for static analysis errors. */
  public readonly keyword: Token;

  /**
   * @param keyword - The `continue` keyword.
   * @param span - The source span of the entire statement.
   */
  constructor(keyword: Token, span: Span) {
    super(span);
    this.keyword = keyword;
  }

  /** @inheritdoc */
  public accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitContinueStmt(this);
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
 * Function declaration: `fn name(params) { ... }`.
 *
 * @example
 * ```cantrip
 * fn add(a, b) {
 *   a + b
 * }
 * ```
 */
export class FunctionStmt extends Stmt {
  /** The name of the function being declared. */
  public readonly name: Token;
  /** The parameters of the function. */
  public readonly params: Token[];
  /** The block body of the function. */
  public readonly body: Expr;

  constructor(name: Token, params: Token[], body: Expr, span: Span) {
    super(span);
    this.name = name;
    this.params = params;
    this.body = body;
  }

  public accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitFunctionStmt(this);
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

/**
 * Return statement - an explicit return from a function.
 *
 * @example
 * ```cantrip
 * fn add(a, b) {
 *   return a + b;
 * }
 * ```
 */
export class ReturnStmt extends Stmt {
  /** The `return` keyword. Used for static analysis errors. */
  public readonly keyword: Token;
  /** Optional value expression to return from a function. */
  public readonly value: Expr | null;

  /**
   * @param keyword - The `return` keyword.
   * @param value - The value being returned.
   * @param span - The source span of the entire statement.
   */
  constructor(keyword: Token, value: Expr | null, span: Span) {
    super(span);
    this.keyword = keyword;
    this.value = value;
  }

  /** @inheritdoc */
  public accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitReturnStmt(this);
  }
}

/**
 * While statement: `while expr { ... }`.
 *
 * @example
 * ```cantrip
 * while flag {
 *   break;
 * }
 * ```
 */
export class WhileStmt extends Stmt {
  /** The condition to check on each run of the loop. */
  public readonly condition: Expr;
  /** The block of code to loop through. */
  public readonly body: Stmt;

  /**
   * @param condition - The loop condition.
   * @param body - The loop block.
   * @param span - The source span of the entire loop.
   */
  constructor(condition: Expr, body: Stmt, span: Span) {
    super(span);
    this.condition = condition;
    this.body = body;
  }

  public accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitWhileStmt(this);
  }
}
