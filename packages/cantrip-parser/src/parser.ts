import {
  AssignExpr,
  BinaryExpr,
  BlockExpr,
  BlockStmt,
  BreakStmt,
  ContinueStmt,
  type Expr,
  ExprStmt,
  GetExpr,
  GroupingExpr,
  IfExpr,
  IndexExpr,
  IndexSetExpr,
  LetStmt,
  LiteralExpr,
  LoopExpr,
  MatchExpr,
  SetExpr,
  type Stmt,
  type Token,
  TokenType,
  UnaryExpr,
  VarExpr,
  WhileStmt,
} from "@cantrip/ast";

/**
 * Error thrown (and collected) when the parser encounters a syntax error.
 *
 * Unlike a hard throw that aborts parsing, these errors are accumulated
 * so the parser can continue and report multiple problems in one pass.
 */
export class ParseError extends Error {
  /** The token at which the error was detected. */
  public readonly token: Token;

  /**
   * @param token - Token that triggered the error.
   * @param message - Human-readable description of the problem.
   */
  constructor(token: Token, message: string) {
    super(message);
    this.name = "ParseError";
    this.token = token;
  }
}

/**
 * Recursive-descent parser for Cantrip.
 *
 * Consumes a flat list of tokens produced by the {@link Scanner}
 * and builds an abstract syntax tree of statements and expressions.
 *
 * The parser follows Pratt-style precedence climbing for expressions
 * and recovers from errors via synchronization so that multiple
 * diagnostics can be reported in a single run.
 */
export class Parser {
  /** Token stream to parse. */
  private readonly tokens: Token[];
  /** Accumulated parse errors. */
  private errors: ParseError[] = [];
  /** Index of the current token. */
  private current = 0;

  /**
   * @param tokens - Complete token list (including the final `Eof` token).
   */
  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  /**
   * Parse the entire token stream into a list of statements.
   *
   * @returns An object containing the produced AST (with `null` entries
   *          for statements that failed to parse) and the list of
   *          collected {@link ParseError}s.
   */
  public parse(): { ast: (Stmt | null)[]; parseErrors: ParseError[] } {
    const ast: (Stmt | null)[] = [];
    while (!this.isAtEnd()) {
      ast.push(this.declaration());
    }

    return { ast, parseErrors: this.errors };
  }

  /**
   * Parse a declaration (currently only `let`) or fall through to a statement.
   *
   * On error the parser synchronizes and returns `null` so the rest of
   * the program can still be examined.
   *
   * @returns The parsed statement, or `null` for recovery was necessary.
   */
  private declaration(): Stmt | null {
    try {
      if (this.match(TokenType.Let)) return this.letDecl();

      return this.statement();
    } catch {
      this.synchronize();
      return null;
    }
  }

  /**
   * Parse a `let` declaration.
   *
   * Grammar:
   * ```
   * let_decl = "let" IDENTIFIER ( "=" expression )? ";" ;
   * ```
   *
   * @returns A {@link LetStmt} node.
   */
  private letDecl(): Stmt {
    const start = this.previous().span.start;
    const name = this.consume(TokenType.Identifier, "Expect variable name.");

    let initializer: Expr | null = null;
    if (this.match(TokenType.Eq)) {
      initializer = this.expression();
    }

    const end = this.consume(
      TokenType.Semicolon,
      "Expect ';' after variable declaration.",
    ).span.end;
    return new LetStmt(name, initializer, { start, end });
  }

  /**
   * Parse a statement.
   *
   * Currently only expression statements are supported; future
   * control-flow statements will be added here.
   *
   * @returns The parsed statement.
   */
  private statement(): Stmt {
    if (this.match(TokenType.Break)) {
      return this.breakStatement();
    }
    if (this.match(TokenType.Continue)) {
      return this.continueStatement();
    }
    if (this.match(TokenType.While)) {
      return this.whileStatement();
    }
    if (this.match(TokenType.If)) {
      // Bypass to prevent requiring semicolon for if
      return this.ifStatement();
    }
    if (this.match(TokenType.Loop)) {
      // Bypass to prevent requiring semicolon for loop
      return this.loopStatement();
    }
    if (this.match(TokenType.Match)) {
      // Bypass to prevent requiring semicolon for match
      return this.matchStatement();
    }
    if (this.match(TokenType.LeftBrace)) {
      return this.blockStatement();
    }
    return this.exprStmt();
  }

  /**
   * Parse an expression statement.
   *
   * Grammar:
   * ```
   * expr_stmt = expression ";" ;
   * ```
   *
   * @returns An {@link ExprStmt} node.
   */
  private exprStmt(): Stmt {
    const expr = this.expression();
    const start = expr.span.start;
    const end = this.consume(TokenType.Semicolon, "Expect ';' after expression.").span
      .end;
    return new ExprStmt(expr, { start, end });
  }

  /**
   * Parse a break statement.
   *
   * Grammar:
   * ```
   * break_stmt = "break" ";" ;
   * ```
   *
   * @returns A {@link BreakStmt} node.
   */
  private breakStatement(): Stmt {
    const keyword = this.previous();
    const end = this.consume(TokenType.Semicolon, "Expect ';' after 'break'").span.end;
    return new BreakStmt(keyword, { start: keyword.span.start, end });
  }

  /**
   * Parse a continue statement.
   *
   * Grammar:
   * ```
   * continue_stmt = "continue" ";" ;
   * ```
   *
   * @returns A {@link BreakStmt} node.
   */
  private continueStatement(): Stmt {
    const keyword = this.previous();
    const end = this.consume(TokenType.Semicolon, "Expect ';' after 'continue'").span.end;
    return new ContinueStmt(keyword, { start: keyword.span.start, end });
  }

  /**
   * Parse a while statement.
   *
   * Grammar:
   * ```
   * while_stmt = "while" expression block ;
   * ```
   *
   * @returns A {@link WhileStmt} node.
   */
  private whileStatement(): Stmt {
    const start = this.previous().span.start;
    const condition = this.expression();
    this.consume(TokenType.LeftBrace, "Expect '{' after loop condition.");
    const body = this.blockStatement();
    return new WhileStmt(condition, body, { start, end: body.span.end });
  }

  /**
   * Bypass function to remove the requirement for a semicolon after an if expression.
   *
   * @returns An {@link IfExpr} wrapped in an {@link ExprStmt}.
   */
  private ifStatement(): Stmt {
    const expr = this.ifExpression();
    return new ExprStmt(expr, expr.span);
  }

  /**
   * Bypass function to remove the requirement for a semicolon after a loop expression.
   *
   * @returns A {@link LoopExpr} wrapped in an {@link ExprStmt}.
   */
  private loopStatement(): Stmt {
    const expr = this.loopExpression();
    return new ExprStmt(expr, expr.span);
  }

  /**
   * Bypass function to remove the requirement for a semicolon after a match expression.
   *
   * @returns A {@link MatchExpr} wrapped in an {@link ExprStmt}.
   */
  private matchStatement(): Stmt {
    const expr = this.matchExpression();
    return new ExprStmt(expr, expr.span);
  }

  /**
   * Parse a block statement.
   *
   * @returns A {@link BlockStmt} node.
   */
  private blockStatement(): Stmt {
    const start = this.previous().span.start;
    const { statements } = this.parseBlockBody();
    const end = this.previous().span.end;
    return new BlockStmt(statements, { start, end });
  }

  /**
   * Parse an expression (entry point for the expression hierarchy).
   *
   * @returns The root of the expression tree.
   */
  private expression(): Expr {
    return this.assignment();
  }

  /**
   * Parse an assignment or compound assignment expression.
   *
   * Handles both simple variable assignment (`x = ...`) and property
   * assignment (`obj.prop = ...`). Compound operators (`+=`, `-=`, etc.)
   * are also recognized.
   *
   * @returns An {@link AssignExpr}, {@link SetExpr}, or a lower-precedence expression.
   */
  private assignment(): Expr {
    const start = this.peek().span.start;
    const expr = this.logicOr();

    if (
      this.match(
        TokenType.Eq,
        TokenType.PlusEq,
        TokenType.MinusEq,
        TokenType.StarEq,
        TokenType.SlashEq,
        TokenType.PercentEq,
      )
    ) {
      const operator = this.previous();
      const value = this.assignment();

      if (expr instanceof VarExpr) {
        const name = expr.name;
        const end = value.span.end;
        return new AssignExpr(name, operator, value, { start, end });
      } else if (expr instanceof GetExpr) {
        const end = value.span.end;
        return new SetExpr(expr.object, expr.name, operator, value, { start, end });
      } else if (expr instanceof IndexExpr) {
        const end = value.span.end;
        return new IndexSetExpr(expr.indexee, expr.bracket, expr.index, operator, value, {
          start,
          end,
        });
      }

      this.error(operator, "Invalid assignment target.");
    }

    return expr;
  }

  /**
   * Parse a logical `or` expression.
   *
   * @returns A {@link BinaryExpr} or a lower-precedence expression.
   */
  private logicOr(): Expr {
    const start = this.peek().span.start;
    let expr = this.logicAnd();

    while (this.match(TokenType.Or)) {
      const operator = this.previous();
      const right = this.logicAnd();
      expr = new BinaryExpr(expr, operator, right, { start, end: right.span.end });
    }

    return expr;
  }

  /**
   * Parse a logical `and` expression.
   *
   * @returns A {@link BinaryExpr} or a lower-precedence expression.
   */
  private logicAnd(): Expr {
    const start = this.peek().span.start;
    let expr = this.equality();

    while (this.match(TokenType.And)) {
      const operator = this.previous();
      const right = this.equality();
      expr = new BinaryExpr(expr, operator, right, { start, end: right.span.end });
    }

    return expr;
  }

  /**
   * Parse equality expressions (`==`, `!=`).
   *
   * @returns A {@link BinaryExpr} or a lower-precedence expression.
   */
  private equality(): Expr {
    const start = this.peek().span.start;
    let expr = this.comparison();

    while (this.match(TokenType.BangEq, TokenType.EqEq)) {
      const operator = this.previous();
      const right = this.comparison();
      const span = { start, end: right.span.end };
      expr = new BinaryExpr(expr, operator, right, span);
    }

    return expr;
  }

  /**
   * Parse comparison expressions (`>`, `>=`, `<`, `<=`).
   *
   * @returns A {@link BinaryExpr} or a lower-precedence expression.
   */
  private comparison(): Expr {
    const start = this.peek().span.start;
    let expr = this.term();

    while (
      this.match(TokenType.Greater, TokenType.GreaterEq, TokenType.Less, TokenType.LessEq)
    ) {
      const operator = this.previous();
      const right = this.term();
      const span = { start, end: right.span.end };
      expr = new BinaryExpr(expr, operator, right, span);
    }

    return expr;
  }

  /**
   * Parse additive expressions (`+`, `-`).
   *
   * @returns A {@link BinaryExpr} or a lower-precedence expression.
   */
  private term(): Expr {
    const start = this.peek().span.start;
    let expr = this.factor();

    while (this.match(TokenType.Minus, TokenType.Plus)) {
      const operator = this.previous();
      const right = this.factor();
      const span = { start, end: right.span.end };
      expr = new BinaryExpr(expr, operator, right, span);
    }

    return expr;
  }

  /**
   * Parse multiplicative expressions (`*`, `/`, `%`).
   *
   * @returns A {@link BinaryExpr} or a lower-precedence expression.
   */
  private factor(): Expr {
    const start = this.peek().span.start;
    let expr = this.unary();

    while (this.match(TokenType.Slash, TokenType.Star, TokenType.Percent)) {
      const operator = this.previous();
      const right = this.unary();
      const span = { start, end: right.span.end };
      expr = new BinaryExpr(expr, operator, right, span);
    }

    return expr;
  }

  /**
   * Parse unary expressions (`!`, `-`).
   *
   * @returns A {@link UnaryExpr} or a call/primary expression.
   */
  private unary(): Expr {
    if (this.match(TokenType.Bang, TokenType.Minus)) {
      const operator = this.previous();
      const right = this.unary();
      const span = { start: operator.span.start, end: right.span.end };
      return new UnaryExpr(operator, right, span);
    }

    return this.call();
  }

  /**
   * Parse postfix call-like expressions: property access and indexing.
   *
   * Handles chains such as `obj.prop[0].name`.
   *
   * @returns A {@link GetExpr}, {@link IndexExpr}, or a primary expression.
   */
  private call(): Expr {
    const start = this.peek().span.start;
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.LeftBracket)) {
        const bracket = this.previous();
        const index = this.expression();
        const end = this.consume(
          TokenType.RightBracket,
          "Expect ']' after specified index.",
        ).span.end;
        expr = new IndexExpr(expr, bracket, index, { start, end });
      } else if (this.match(TokenType.Dot)) {
        const name = this.consume(
          TokenType.Identifier,
          "Expect property name after '.'.",
        );
        const end = name.span.end;
        expr = new GetExpr(expr, name, { start, end });
      } else {
        break;
      }
    }

    return expr;
  }

  /**
   * Parse primary expression: literals, variables, arrays, objects, and grouping.
   *
   * @returns The corresponding expression node.
   * @throws {ParseError} when no valid primary expression is found.
   */
  private primary(): Expr {
    // Basic literals
    if (this.match(TokenType.True)) return new LiteralExpr(true, this.previous().span);
    if (this.match(TokenType.False)) return new LiteralExpr(false, this.previous().span);
    if (this.match(TokenType.Nil)) return new LiteralExpr(null, this.previous().span);

    if (this.match(TokenType.Number, TokenType.String)) {
      const token = this.previous();
      return new LiteralExpr(token.literal, token.span);
    }

    // Array literals
    if (this.match(TokenType.LeftBracket)) return this.array();

    // Object Literals or Blocks
    if (this.match(TokenType.LeftBrace)) {
      if (this.looksLikeObjectLiteral()) {
        return this.finishObjectLiteral();
      }
      return this.blockExpression();
    }

    // Variables
    if (this.match(TokenType.Identifier)) {
      return new VarExpr(this.previous(), this.previous().span);
    }

    // Grouping
    if (this.match(TokenType.LeftParen)) {
      const start = this.previous().span.start;
      const expr = this.expression();
      const end = this.consume(TokenType.RightParen, "Expect ')' after expression.").span
        .end;
      return new GroupingExpr(expr, { start, end });
    }

    // Control flow
    if (this.match(TokenType.If)) {
      return this.ifExpression();
    }

    if (this.match(TokenType.Loop)) {
      return this.loopExpression();
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  /**
   * Check the next two tokens to determine if parsing an object literal or block expression.
   *
   * @returns `true` if the next two tokens indicate an object literal
   */
  private looksLikeObjectLiteral(): boolean {
    if (this.check(TokenType.RightBrace)) return true; // Prefer empty object

    if (this.check(TokenType.Identifier) || this.check(TokenType.String)) {
      return this.peekNext().type === TokenType.Colon;
    }
    return false;
  }

  /**
   * Parse an array literal.
   *
   * Supports trailing commas.
   *
   * Grammar (simplified):
   * ```
   * array = "[" ( expression ( "," expression )* ","? )? "]"
   * ```
   *
   * @returns A {@link LiteralExpr} whose value is an `Expr[]`.
   */
  private array(): Expr {
    // Record start position
    const start = this.previous().span.start;
    const arr: Expr[] = [];
    while (
      this.peek().type !== TokenType.RightBracket &&
      this.peek().type !== TokenType.Semicolon &&
      !this.isAtEnd()
    ) {
      // Check for comma if array already contains an element
      if (arr.length > 0) {
        this.consume(TokenType.Comma, "Expect ',' between array elements.");
      }

      // Parse the expression and push it to the current array
      arr.push(this.expression());

      // Conditional check to allow a trailing comma
      if (
        this.peek().type === TokenType.Comma &&
        this.peekNext().type === TokenType.RightBracket
      ) {
        this.advance();
      }
    }
    const end = this.consume(TokenType.RightBracket, "Expect ']' after array literal.")
      .span.end;
    return new LiteralExpr(arr, { start, end });
  }

  /**
   * Parse an object literal.
   *
   * Keys may be identifiers or string literals. Trailing commas are allowed.
   *
   * Grammar (simplified):
   * ```
   * object = "{" ( ( IDENTIFIER | STRING ) ":" expression ( "," ... )* ","? )? "}"
   * ```
   *
   * @returns A {@link LiteralExpr} whose value is a `Map<string, Expr>`.
   */
  private finishObjectLiteral(): Expr {
    // Record start position
    const start = this.previous().span.start;
    // Store key-value pairs as a map
    const obj = new Map<string, Expr>();
    while (
      this.peek().type !== TokenType.RightBrace &&
      this.peek().type !== TokenType.Semicolon &&
      !this.isAtEnd()
    ) {
      // Check for commma if internal map already contains fields
      if (obj.size > 0) {
        this.consume(TokenType.Comma, "Expect ',' between object fields.");
      }

      let key: string;

      // Record key-value pair
      if (this.peek().type === TokenType.String) key = this.advance().literal as string;
      else key = this.consume(TokenType.Identifier, "Expect field identifier.").lexeme;
      this.consume(TokenType.Colon, "Expect ':' after field identifier.");
      const value = this.expression();

      // Add key and value to the map
      obj.set(key, value);

      // Conditional check to allow a trailing comma
      if (
        this.peek().type === TokenType.Comma &&
        this.peekNext().type === TokenType.RightBrace
      ) {
        this.advance();
      }
    }
    const end = this.consume(TokenType.RightBrace, "Expect '}' after object literal.")
      .span.end;
    return new LiteralExpr(obj, { start, end });
  }

  /**
   * Parse an if expression.
   *
   * Grammar:
   * ```
   * if_expr = "if" expression block ( "else" (if_expr | block) )? ;
   * ```
   *
   * @returns An {@link IfExpr} node.
   */
  private ifExpression(): Expr {
    const start = this.previous().span.start;
    const condition = this.expression();
    this.consume(TokenType.LeftBrace, "Expect '{' after if condition.");

    const thenBranch = this.blockExpression();
    let end = thenBranch.span.end;
    let elseBranch: Expr | null = null;
    if (this.match(TokenType.Else)) {
      if (this.match(TokenType.If)) {
        elseBranch = this.ifExpression();
      } else {
        this.consume(TokenType.LeftBrace, "Expect '{' or 'if' after 'else'.");
        elseBranch = this.blockExpression();
      }
      end = elseBranch.span.end;
    }

    return new IfExpr(condition, thenBranch, elseBranch, { start, end });
  }

  /**
   * Parse a loop expression.
   *
   * Grammar:
   * ```
   * loop_expr = "loop" block ;
   * ```
   *
   * @returns A {@link LoopExpr} node.
   */
  private loopExpression(): Expr {
    const start = this.previous().span.start;
    this.consume(TokenType.LeftBrace, "Expect '{' after 'loop'.");

    const body = this.blockExpression();
    return new LoopExpr(body, { start, end: body.span.end });
  }

  /**
   * Parse a match expression.
   *
   * Grammar (simplified):
   * ```
   * match_expr = "match" expression "{" expression "=>" expression "," ... ","? "}" ;
   * ```
   */
  private matchExpression(): Expr {
    const keyword = this.previous();
    const start = keyword.span.start;
    const matcher = this.expression();
    this.consume(TokenType.LeftBrace, "Expect '{' after matching expression.");
    const branches = new Map<Expr, Expr>();
    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      const matchValue = this.expression();
      this.consume(TokenType.FatArrow, "Expect '=>' after match value.");
      const returnValue = this.expression();

      // Push the match branch
      branches.set(matchValue, returnValue);

      // Check for trailing comma
      if (this.match(TokenType.Comma)) {
        if (this.peek().type === TokenType.RightBrace) break;
      }
    }
    const end = this.consume(TokenType.RightBrace, "Expect '}' after match branches.")
      .span.end;

    return new MatchExpr(matcher, branches, { start, end });
  }

  /**
   * Parse a block expression.
   *
   * @returns A {@link BlockExpr} node.
   */
  private blockExpression(): Expr {
    const start = this.previous().span.start;
    const { statements, value } = this.parseBlockBody();
    const end = this.previous().span.end;
    return new BlockExpr(statements, value, { start, end });
  }

  /**
   * Parse the internal statements of a block expression or statement.
   *
   * @returns An object containing the statements and an optional value which is ignored
   *          by {@link blockStatement}.
   */
  private parseBlockBody(): { statements: (Stmt | null)[]; value: Expr | null } {
    const statements: (Stmt | null)[] = [];
    let value: Expr | null = null;

    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      // Check for keyword indicating a declaration or statement
      if (this.check(TokenType.Let)) {
        statements.push(this.declaration());
        continue;
      }

      // Parse an expression if unclear
      const expr = this.expression();

      // Check for semicolon or end of block
      if (this.match(TokenType.Semicolon)) {
        // If semicolon, push expression statement
        const end = this.previous().span.end;
        statements.push(new ExprStmt(expr, { start: expr.span.start, end }));
      } else {
        // Final value of block
        value = expr;
        break;
      }
    }

    this.consume(TokenType.RightBrace, "Expect '}' after block.");
    return { statements, value };
  }

  // --- Utility helpers ------------------------------------------------

  /**
   * Advance if the current token matches any of the given types.
   *
   * @param types - One or more token types to match against.
   * @returns `true` if a match occurred and the token was consumed.
   */
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  /**
   * Require the current token to be of the expected type.
   *
   * @param type - Expected token type.
   * @param message - Error message if the expectation is not met.
   * @returns The consumed token.
   * @throws {ParseError} when the current token does not match.
   */
  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();

    throw this.error(this.peek(), message);
  }

  /**
   * Check whether the current token is of the given type without consuming it.
   *
   * @param type - Token type to test.
   * @returns `true` if the current token matches.
   */
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  /**
   * Consume and return the current token, advancing the cursor.
   *
   * @returns The token that was just consumed.
   */
  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  /**
   * @returns `true` when the parser has reached the end-of-file token.
   */
  private isAtEnd(): boolean {
    return this.peek().type === TokenType.Eof;
  }

  /**
   * @returns The current token without consuming it.
   */
  private peek(): Token {
    return this.tokens[this.current];
  }

  /**
   * Look ahead one token beyond the current position.
   *
   * @returns The token at `current + 1`.
   */
  private peekNext(): Token {
    return this.tokens[this.current + 1];
  }

  /**
   * @returns The most recently consumed token.
   */
  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  /**
   * Record a parse error and return it so it can be thrown.
   *
   * @param token - Token associated with the error.
   * @param message - Description of the problem.
   * @returns A new {@link ParseError} instance.
   */
  private error(token: Token, message: string): ParseError {
    const err = new ParseError(token, message);
    this.errors.push(err);
    return err;
  }

  /**
   * Discard tokens until a likely statement boundary is found.
   *
   * Used after a syntax error so that subsequent declarations/statements
   * can still be parsed and additional diagnostics reported.
   */
  private synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type == TokenType.Semicolon) return;

      switch (this.peek().type) {
        case TokenType.Break:
        case TokenType.Continue:
        case TokenType.Fn:
        case TokenType.If:
        case TokenType.Let:
        case TokenType.Loop:
        case TokenType.Match:
        case TokenType.Return:
        case TokenType.While:
          return;
      }

      this.advance();
    }
  }
}
