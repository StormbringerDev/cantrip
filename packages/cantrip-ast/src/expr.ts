import type { Span } from "@cantrip/types";
import type { Stmt } from "./stmt.js";
import type { Token } from "./token.js";

/** Primitive values that can appear in a Cantrip program. */
type AstValue = number | string | boolean | null;

/** Array literal represented as a list of expressions. */
type AstArray = Expr[];

/** Object literal represented as a map from string keys to expressions. */
type AstObject = Map<string, Expr>;

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
  visitCallExpr(expr: CallExpr): R;
  visitGetExpr(expr: GetExpr): R;
  visitGroupingExpr(expr: GroupingExpr): R;
  visitIfExpr(expr: IfExpr): R;
  visitIndexExpr(expr: IndexExpr): R;
  visitIndexSetExpr(expr: IndexSetExpr): R;
  visitLiteralExpr(expr: LiteralExpr): R;
  visitLoopExpr(expr: LoopExpr): R;
  visitMatchExpr(expr: MatchExpr): R;
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
  /** Right-hand side expression. */
  public readonly value: Expr;

  /**
   * @param name - Identifier being assigned to.
   * @param value - Expression providing the new value.
   * @param span - Source span of the whole assignment.
   */
  constructor(name: Token, value: Expr, span: Span) {
    super(span);
    this.name = name;
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
 * Function call: `function(arguments)`.
 *
 * @example
 * ```cantrip
 * add(1, 2)
 * ```
 */
export class CallExpr extends Expr {
  /** The expression resolving to a function value. */
  public readonly callee: Expr;
  /** The right parenthesis; used for error reporting. */
  public readonly paren: Token;
  /** Argument expressions passed to the funciton. */
  public readonly args: Expr[];

  /**
   * @param callee - The function value expression.
   * @param paren - The right paren token.
   * @param args - The list of argument expressions.
   * @param span - The source span of the entire call expression.
   */
  constructor(callee: Expr, paren: Token, args: Expr[], span: Span) {
    super(span);
    this.callee = callee;
    this.paren = paren;
    this.args = args;
  }

  /** @inheritdoc */
  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitCallExpr(this);
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

  /**
   * @param condition - The if condition expression.
   * @param thenBranch - The block expression of the if expression.
   * @param elseBranch - Optional block or if expression.
   * @param span - Source span of the entire expression.
   */
  constructor(condition: Expr, thenBranch: Expr, elseBranch: Expr | null, span: Span) {
    super(span);
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }

  /** @inheritdoc */
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
 * Index assignment: `indexee[index] = value`.
 *
 * @example
 * ```cantrip
 * names[2] = "Kara"
 * ```
 */
export class IndexSetExpr extends Expr {
  /** Expression being indexed. */
  public readonly indexee: Expr;
  /** The opening bracket token (useful for error reporting). */
  public readonly bracket: Token;
  /** Index expression. */
  public readonly index: Expr;
  /** Value being assigned. */
  public readonly value: Expr;

  /**
   * @param indexee - Expression evaluating to target data structure.
   * @param bracket - The `[` token.
   * @param index - Expression evaluating to the target index or key.
   * @param value - Expression providing the new value.
   * @param span - Source span of the whole index set expression.
   */
  constructor(indexee: Expr, bracket: Token, index: Expr, value: Expr, span: Span) {
    super(span);
    this.indexee = indexee;
    this.bracket = bracket;
    this.index = index;
    this.value = value;
  }

  /** @inheritdoc */
  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitIndexSetExpr(this);
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
  public readonly value: AstValue | AstArray | AstObject;

  /**
   * @param value - The literal value or nested expression structure.
   * @param span - Source span of the literal.
   */
  constructor(value: AstValue | AstArray | AstObject, span: Span) {
    super(span);
    this.value = value;
  }

  /** @inheritdoc */
  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
}

/**
 * Loop expression: `loop { ... }`; creates an infinite loop.
 *
 * @example
 * ```cantrip
 * loop {
 *   print("RELEASE ME!");
 * }
 * ```
 */
export class LoopExpr extends Expr {
  /** The loop block to be executed indefinitely. */
  public readonly body: Expr;

  /**
   * @param body - The loop block.
   * @param span - Source span of the entire loop.
   */
  constructor(body: Expr, span: Span) {
    super(span);
    this.body = body;
  }

  /** @inheritdoc */
  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLoopExpr(this);
  }
}

/**
 * Match expression: `match variable { value => returnVal, ... }`.
 *
 * @example
 * ```cantrip
 * match number {
 *   1 => 10,
 *   2 => 20,
 *   3 => 30,
 *   _ => 100,
 * }
 * ```
 */
export class MatchExpr extends Expr {
  /** Expression to check the value of. */
  public readonly matcher: Expr;
  /** Values and their return values. */
  public readonly branches: Map<Expr, Expr>;

  /**
   * @param matcher - The expression to be matched against.
   * @param branches - The set of expected values and return values.
   * @param span - The source span of the entire expression.
   */
  constructor(matcher: Expr, branches: Map<Expr, Expr>, span: Span) {
    super(span);
    this.matcher = matcher;
    this.branches = branches;
  }

  /** @inheritdoc */
  public accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitMatchExpr(this);
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
  /** Value being assigned. */
  public readonly value: Expr;

  /**
   * @param object - Expression evaluating to the target object.
   * @param name - Identifier of the property.
   * @param value - Expression providing the new value.
   * @param span - Source span of the whole set expression.
   */
  constructor(object: Expr, name: Token, value: Expr, span: Span) {
    super(span);
    this.object = object;
    this.name = name;
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
