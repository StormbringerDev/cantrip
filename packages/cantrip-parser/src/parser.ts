import {
  AssignExpr,
  BinaryExpr,
  type Expr,
  ExprStmt,
  GetExpr,
  GroupingExpr,
  LetStmt,
  LiteralExpr,
  SetExpr,
  type Stmt,
  type Token,
  TokenType,
  UnaryExpr,
  VarExpr,
} from "@cantrip/ast";

export class ParseError extends Error {
  public readonly token: Token;

  constructor(token: Token, message: string) {
    super(message);
    this.name = "ParseError";
    this.token = token;
  }
}

export class Parser {
  private readonly tokens: Token[];
  private errors: ParseError[] = [];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(): { ast: (Stmt | null)[]; parseErrors: ParseError[] } {
    const ast: (Stmt | null)[] = [];
    while (!this.isAtEnd()) {
      ast.push(this.declaration());
    }

    return { ast, parseErrors: this.errors };
  }

  private declaration(): Stmt | null {
    try {
      if (this.match(TokenType.Let)) return this.letDecl();

      return this.statement();
    } catch {
      this.synchronize();
      return null;
    }
  }

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

  private statement(): Stmt {
    return this.exprStmt();
  }

  private exprStmt(): Stmt {
    const expr = this.expression();
    const start = expr.span.start;
    const end = this.consume(TokenType.Semicolon, "Expect ';' after expression.").span
      .end;
    return new ExprStmt(expr, { start, end });
  }

  private expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    const start = this.peek().span.start;
    const expr = this.equality();

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
      }

      this.error(operator, "Invalid assignment target.");
    }

    return expr;
  }

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

  private unary(): Expr {
    if (this.match(TokenType.Bang, TokenType.Minus)) {
      const operator = this.previous();
      const right = this.unary();
      const span = { start: operator.span.start, end: right.span.end };
      return new UnaryExpr(operator, right, span);
    }

    return this.call();
  }

  private call(): Expr {
    const start = this.peek().span.start;
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.Dot)) {
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

    // Object Literals
    if (this.match(TokenType.LeftBrace)) return this.object();

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

    throw this.error(this.peek(), "Expect expression.");
  }

  private array(): Expr {
    // Record start position
    const start = this.previous().span.start;
    const arr: Expr[] = [];
    while (this.peek().type !== TokenType.RightBracket && !this.isAtEnd()) {
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

  private object(): Expr {
    // Record start position
    const start = this.previous().span.start;
    // Store key-value pairs as a map
    const obj = new Map<string, Expr>();
    while (this.peek().type !== TokenType.RightBrace && !this.isAtEnd()) {
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

  // Consume current token if and only if it matches one of the provided types
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  // Consume and return the expected token if it matches, throw error if not a match
  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();

    throw this.error(this.peek(), message);
  }

  // Check if current token matches provided type without consuming it
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  // Consume and return current token
  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.Eof;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private peekNext(): Token {
    return this.tokens[this.current + 1];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private error(token: Token, message: string): ParseError {
    const err = new ParseError(token, message);
    this.errors.push(err);
    return err;
  }

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
