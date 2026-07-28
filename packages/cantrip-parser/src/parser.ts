import {
  BinaryExpr,
  type Expr,
  GroupingExpr,
  LiteralExpr,
  type Token,
  TokenType,
  UnaryExpr,
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

  public parse(): { ast: Expr; errors: ParseError[] } {
    const ast = this.expression();
    return { ast, errors: this.errors };
  }

  private expression(): Expr {
    return this.equality();
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

    return this.primary();
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
