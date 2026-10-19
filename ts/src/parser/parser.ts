import { DiagnosticCollector } from "../diagnostic/collector.js";
import { error as diagnosticError } from "../diagnostic/create.js";
import { binary, grouping, literal, unary, type Expr } from "./expr.js";
import { TokenType, type Token } from "./token.js";

class ParseError extends Error {
  constructor() {
    super();
    this.name = "ParseError";
  }
}

export class Parser {
  private readonly diagnostics: DiagnosticCollector;
  private readonly tokens: Token[];
  private current = 0;

  constructor(tokens: Token[], diagnostics: DiagnosticCollector) {
    this.tokens = tokens;
    this.diagnostics = diagnostics;
  }

  parse(): Expr | null {
    try {
      return this.expression();
    } catch {
      return null;
    }
  }

  private expression(): Expr {
    return this.equality();
  }

  private equality(): Expr {
    let expr = this.comparison();

    while (this.match(TokenType.EqEq, TokenType.BangEq)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = binary(expr, operator, right, {
        start: expr.span.start,
        end: right.span.end,
      });
    }

    return expr;
  }

  private comparison(): Expr {
    let expr = this.term();

    while (
      this.match(
        TokenType.Greater,
        TokenType.GreaterEq,
        TokenType.Less,
        TokenType.LessEq,
      )
    ) {
      const operator = this.previous();
      const right = this.term();
      expr = binary(expr, operator, right, {
        start: expr.span.start,
        end: right.span.end,
      });
    }

    return expr;
  }

  private term(): Expr {
    let expr = this.factor();

    while (this.match(TokenType.Plus, TokenType.Minus)) {
      const operator = this.previous();
      const right = this.factor();
      expr = binary(expr, operator, right, {
        start: expr.span.start,
        end: right.span.end,
      });
    }

    return expr;
  }

  private factor(): Expr {
    let expr = this.unary();

    while (this.match(TokenType.Star, TokenType.Slash, TokenType.Percent)) {
      const operator = this.previous();
      const right = this.unary();
      expr = binary(expr, operator, right, {
        start: expr.span.start,
        end: right.span.end,
      });
    }

    return expr;
  }

  private unary(): Expr {
    if (this.match(TokenType.Minus, TokenType.Bang)) {
      const operator = this.previous();
      const right = this.unary();
      return unary(operator, right, {
        start: operator.span.start,
        end: right.span.end,
      });
    }

    return this.primary();
  }

  private primary(): Expr {
    if (this.match(TokenType.True)) return literal(true, this.previous().span);
    if (this.match(TokenType.False))
      return literal(false, this.previous().span);
    if (this.match(TokenType.Nil)) return literal(null, this.previous().span);

    if (this.match(TokenType.Number, TokenType.String))
      return literal(this.previous().literal, this.previous().span);

    if (this.match(TokenType.LeftParen)) {
      const start = this.previous().span.start;
      const expr = this.expression();
      const end = this.consume(
        TokenType.RightParen,
        "expect `)` after expression",
      ).span.end;
      return grouping(expr, { start, end });
    }

    throw this.error(this.peek(), "expect expression");
  }

  // --- Token management ------------------------------------------------------

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private consume(type: TokenType, message: string) {
    if (this.check(type)) return this.advance();

    throw this.error(this.peek(), message);
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.Eof;
  }

  // --- Error handling --------------------------------------------------------

  private error(token: Token, message: string): ParseError {
    this.diagnostics.emit(diagnosticError(message, token));
    return new ParseError();
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.Semicolon) return;

      switch (this.peek().type) {
        case TokenType.Fn:
        case TokenType.Let:
        case TokenType.If:
        case TokenType.While:
        case TokenType.Break:
        case TokenType.Continue:
        case TokenType.Return:
          return;
        default:
          this.advance();
      }
    }
  }
}
