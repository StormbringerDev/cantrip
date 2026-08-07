import type { Span } from "@cantrip/types";
import type { Stmt } from "./stmt.js";
import type { Token } from "./token.js";

/** Primitive values that can appear in a Cantrip program. */
export type CantripValue = number | string | boolean | null;

/** Array literal represented as a list of expressions. */
export type CantripArray = Expr[];

/** Object literal represented as a map from string keys to expressions. */
export type CantripObject = Map<string, Expr>;

/**
 * Base class for every expression node in the Cantrip AST.
 *
 * All concrete expression classes extend this and implement the
 * visitor pattern via {@link accept}.
 */
export abstract class Expr {
  /** Source location of this expression. */
  public readonly span: Span;

  /**
   * @param span - Source span covering the entire expression.
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
  public abstract accept<R>(visitor: ExprVisitor<R>): R;
}

/**
 * Visitor interface for traversing expression nodes.
 *
 * @typeParam R - The type returned by each visit method.
 */
export interface ExprVisitor<R> {
  visitAssignExpr(expr: AssignExpr): R;
  visitBinaryExpr(expr: BinaryExpr): R;
  visitBlockExpr(expr: BlockExpr): R;
  visitGetExpr(expr: GetExpr): R;
  visitGroupingExpr(expr: GroupingExpr): R;
  visitIfExpr(expr: IfExpr): R;
  visitIndexExpr(expr: IndexExpr): R;
  visitLiteralExpr(expr: LiteralExpr): R;
  visitSetExpr(expr: SetExpr): R;
  visitUnaryExpr(expr: UnaryExpr): R;
  visitVarExpr(expr: VarExpr): R;
}

/**
 * Assignment expression: `name = value` or compound forms (`+=`, `-=`, etc.).
 *
 * @example
 * ```cantrip
 * x = 42
 * count += 1
 * ```
 */
export class AssignExpr extends Expr {
  /** Target variable name. */
  public readonly name: Token;
  /** Assignment operator (`=`, `+=`, `-=`, ...). */
  public readonly operator: Token;
  /** Right-hand side expression. */
  public readonly value: Expr;

  /**
   * @param name - Identifier being assigned to.
   * @param operator - The assignment operator token.
   * @param value - Expression providing the new value.
   * @param span - Source span of the whole assignment.
   */
  constructor(name: Token, operator: Token, value: Expr, span: Span) {
    super(span);
    this.name = name;
    this.operator = operator;
    this.value = value;
  }

  /** @inheritdoc */
  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitAssignExpr(this);
  }
}

/**
 * Binary operator expression: `left op right`.
 *
 * Covers arithmetic, comparison, and logic operators.
 */
export class BinaryExpr extends Expr {
  /** Left operand. */
  public readonly left: Expr;
  /** Operator token. */
  public readonly operator: Token;
  /** Right operand. */
  public readonly right: Expr;

  /**
   * @param left - Left-hand expression.
   * @param operator - Binary operator token.
   * @param right - Right-hand expression.
   * @param span Source span of the whole binary expression.
   */
  constructor(left: Expr, operator: Token, right: Expr, span: Span) {
    super(span);
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  /** @inheritdoc */
  public accept<R>(visitor: ExprVisitor<R>) {
    return visitor.visitBinaryExpr(this);
  }
}

/**
 * Block expression - a set of statements wrapped in curley braces (`{ ... }`)
 *
 * @example
 * ```cantrip
 * {
 *   let x = 42;
 * }
 * ```
 */
export class BlockExpr extends Expr {
  /**
   * The list of contained statements.
   * `null` values are placeholders for where {@link ParseError}s occured.
   */
  public readonly statements: (Stmt | null)[];
  /** The optional value expression; `nil` by default. */
  public readonly value: Expr | null;

  /**
   * @param statements - List of statements to run.
   * @param value
   * @param span - Source span of the entire block including braces.
   */
  constructor(statements: (Stmt | null)[], value: Expr | null, span: Span) {
    super(span);
    this.statements = statements;
    this.value = value;
  }

  /** @inheritdoc */
  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitBlockExpr(this);
  }
}

/**
 * Property access: `object.name`.
 *
 * @example
 * ```cantrip
 * player.health
 * ```
 */
export class GetExpr extends Expr {
  /** Object being accessed. */
  public readonly object: Expr;
  /** Property name. */
  public readonly name: Token;

  /**
   * @param object - Expression evaluating to the target object.
   * @param name - Identifier of the property.
   * @param span - Source span of the whole get expression.
   */
  constructor(object: Expr, name: Token, span: Span) {
    super(span);
    this.object = object;
    this.name = name;
  }

  /** @inheritdoc */
  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGetExpr(this);
  }
}

/**
 * Parenthesized expression used purely for grouping / precedence.
 *
 * @example
 * ```cantrip
 * (a + b) * c
 * ```
 */
export class GroupingExpr extends Expr {
  /** The enclosed expression. */
  public readonly expression: Expr;

  /**
   * @param expression - Expression inside the parentheses.
   * @param span - Source span including the parentheses.
   */
  constructor(expression: Expr, span: Span) {
    super(span);
    this.expression = expression;
  }

  /** @inheritdoc */
  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGroupingExpr(this);
  }
}

/**
 * If expression: `if expr { ... } else { ... }`.
 *
 * @example
 * ```cantrip
 * if x % 2 == 0 {
 *   true
 * } else {
 *   false
 * }
 */
export class IfExpr extends Expr {
  /** Condition expression to check against. */
  public readonly condition: Expr;
  /** Block to be executed if {@link condition} is true. */
  public readonly thenBranch: Expr;
  /** Optional else branch if condition is false. */
  public readonly elseBranch: Expr | null;

  constructor(condition: Expr, thenBranch: Expr, elseBranch: Expr | null, span: Span) {
    super(span);
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }

  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitIfExpr(this);
  }
}

/**
 * Index / subscript expression: `indexee[index]`.
 *
 * @example
 * ```cantrip
 * items[0]
 * map["key"]
 * ```
 */
export class IndexExpr extends Expr {
  /** Expression being indexed. */
  public readonly indexee: Expr;
  /** The opening bracket token (useful for error reporting). */
  public readonly bracket: Token;
  /** Index expression. */
  public readonly index: Expr;

  /**
   * @param indexee - Expression evaluating to an indexable value.
   * @param bracket - The `[` token.
   * @param index - Expression providing the index.
   * @param span - Source span of the whole index expression.
   */
  constructor(indexee: Expr, bracket: Token, index: Expr, span: Span) {
    super(span);
    this.indexee = indexee;
    this.bracket = bracket;
    this.index = index;
  }

  /** @inheritdoc */
  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitIndexExpr(this);
  }
}

/**
 * Literal value (number, string, boolean, nil, array, or object).
 */
export class LiteralExpr extends Expr {
  /**
   * The literal value.
   *
   * Arrays and objects are stored as their AST representation
   * (`Expr[]` and `Map<string, Expr>` respectively).
   */
  public readonly value: CantripValue | CantripArray | CantripObject;

  /**
   * @param value - The literal value or nested expression structure.
   * @param span - Source span of the literal.
   */
  constructor(value: CantripValue | CantripArray | CantripObject, span: Span) {
    super(span);
    this.value = value;
  }

  /** @inheritdoc */
  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
}

/**
 * Property assignment: `object.name = value` (or compound forms).
 *
 * @example
 * ```cantrip
 * player.health = 100
 * player.score += 10
 * ```
 */
export class SetExpr extends Expr {
  /** Object whose property is being set. */
  public readonly object: Expr;
  /** Property name. */
  public readonly name: Token;
  /** Assignment operator. */
  public readonly operator: Token;
  /** Value being assigned. */
  public readonly value: Expr;

  /**
   * @param object - Expression evaluating to the target object.
   * @param name - Identifier of the property.
   * @param operator - Assignment operator token.
   * @param value - Expression providing the new value.
   * @param span - Source span of the whole set expression.
   */
  constructor(object: Expr, name: Token, operator: Token, value: Expr, span: Span) {
    super(span);
    this.object = object;
    this.name = name;
    this.operator = operator;
    this.value = value;
  }

  /** @inheritdoc */
  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitSetExpr(this);
  }
}

/**
 * Unary operator epression: `op right`.
 *
 * @example
 * ```cantrip
 * -x
 * !flag
 * ```
 */
export class UnaryExpr extends Expr {
  /** Unary operator token. */
  public readonly operator: Token;
  /** Operand. */
  public readonly right: Expr;

  /**
   * @param operator - The unary operator.
   * @param right Operand expression.
   * @param span Source span of the whole unary expression.
   */
  constructor(operator: Token, right: Expr, span: Span) {
    super(span);
    this.operator = operator;
    this.right = right;
  }

  /** @inheritdoc */
  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitUnaryExpr(this);
  }
}

/**
 * Variable reference: simply an identifier.
 *
 * @example
 * ```cantrip
 * player
 * health
 * ```
 */
export class VarExpr extends Expr {
  /** The identifier token. */
  public readonly name: Token;

  /**
   * @param name - Identifier being referenced.
   * @param span - Source span of the identifier.
   */
  constructor(name: Token, span: Span) {
    super(span);
    this.name = name;
  }

  /** @inheritdoc */
  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitVarExpr(this);
  }
}
