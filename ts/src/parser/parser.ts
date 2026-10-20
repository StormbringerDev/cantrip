import { DiagnosticCollector } from "../diagnostic/collector.js";
import { error as diagnosticError } from "../diagnostic/create.js";
import { Position } from "../types/location.js";
import * as astExpr from "./expr.js";
import type { Expr } from "./expr.js";
import * as astStmt from "./stmt.js";
import type { Stmt } from "./stmt.js";
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

  parse(): (Stmt | null)[] {
    const statements: (Stmt | null)[] = [];
    while (!this.isAtEnd()) {
      statements.push(this.declaration());
    }

    return statements;
  }

  private declaration(): Stmt | null {
    try {
      if (this.match(TokenType.Const)) return this.constDeclaration();
      if (this.match(TokenType.Let)) return this.letDeclaration();

      return this.statement();
    } catch (err) {
      if (!(err instanceof ParseError)) throw err;
      this.synchronize();
      return null;
    }
  }

  private constDeclaration(): Stmt {
    const start = this.previous().span.start;
    const name = this.consume(TokenType.Identifier, "expect constant name");
    this.consume(TokenType.Eq, "'const' declarations must be initialized");
    const initializer = this.expression();

    const end = this.consume(
      TokenType.Semicolon,
      "expect ';' after constant declaration",
    ).span.end;
    return astStmt.const_(name, initializer, { start, end });
  }

  private letDeclaration(): Stmt {
    const start = this.previous().span.start;
    const name = this.consume(TokenType.Identifier, "expect variable name");

    let initializer: Expr | null = null;
    if (this.match(TokenType.Eq)) initializer = this.expression();

    const end = this.consume(
      TokenType.Semicolon,
      "expect ';' after variable declaration",
    ).span.end;
    return astStmt.let_(name, initializer, { start, end });
  }

  private statement(): Stmt {
    // A block where a statement is expected is parsed as a statement
    if (this.match(TokenType.LeftBrace)) return this.blockStatement();
    if (this.match(TokenType.Break)) return this.breakStatement();
    if (this.match(TokenType.Continue)) return this.continueStatement();
    // Bypass to remove requirement for semicolon on lone if expression
    if (this.match(TokenType.If)) return this.ifStatement();
    if (this.match(TokenType.While)) return this.whileStatement();

    return this.expressionStatement();
  }

  private blockStatement(): Stmt {
    const start = this.previous().span.start;
    const { statements, end } = this.parseBlock();
    return astStmt.block(statements, { start, end });
  }

  private breakStatement(): Stmt {
    const keyword = this.previous();
    const end = this.consume(TokenType.Semicolon, "expect ';' after 'break'")
      .span.end;
    return astStmt.break_(keyword, { start: keyword.span.start, end });
  }

  private continueStatement(): Stmt {
    const keyword = this.previous();
    const end = this.consume(TokenType.Semicolon, "expect ';' after 'continue'")
      .span.end;
    return astStmt.continue_(keyword, { start: keyword.span.start, end });
  }

  private expressionStatement(): Stmt {
    const expr = this.expression();
    const end = this.consume(TokenType.Semicolon, "expect ';' after expression")
      .span.end;
    return astStmt.expression(expr, { start: expr.span.start, end });
  }

  private ifStatement(): Stmt {
    const expr = this.ifExpression();
    return astStmt.expression(expr, expr.span);
  }

  private whileStatement(): Stmt {
    const start = this.previous().span.start;
    const condition = this.expression();
    this.consume(TokenType.LeftBrace, "expect '{' after loop condition");
    const body = this.blockStatement();

    return astStmt.while_(condition, body, { start, end: body.span.end });
  }

  private expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    const expr = this.or();

    if (this.match(TokenType.Eq)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr.type === "Variable") {
        const name = expr.name;
        return astExpr.assign(name, value, {
          start: name.span.start,
          end: value.span.end,
        });
      }

      this.error(equals, "invalid assignment target");
    }

    return expr;
  }

  private or(): Expr {
    let expr = this.and();

    while (this.match(TokenType.Or)) {
      const operator = this.previous();
      const right = this.and();
      expr = astExpr.binary(expr, operator, right, {
        start: expr.span.start,
        end: right.span.end,
      });
    }

    return expr;
  }

  private and(): Expr {
    let expr = this.equality();

    while (this.match(TokenType.And)) {
      const operator = this.previous();
      const right = this.equality();
      expr = astExpr.binary(expr, operator, right, {
        start: expr.span.start,
        end: right.span.end,
      });
    }

    return expr;
  }

  private equality(): Expr {
    let expr = this.comparison();

    while (this.match(TokenType.EqEq, TokenType.BangEq)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = astExpr.binary(expr, operator, right, {
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
      expr = astExpr.binary(expr, operator, right, {
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
      expr = astExpr.binary(expr, operator, right, {
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
      expr = astExpr.binary(expr, operator, right, {
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
      return astExpr.unary(operator, right, {
        start: operator.span.start,
        end: right.span.end,
      });
    }

    return this.primary();
  }

  private primary(): Expr {
    if (this.match(TokenType.True))
      return astExpr.literal(true, this.previous().span);
    if (this.match(TokenType.False))
      return astExpr.literal(false, this.previous().span);
    if (this.match(TokenType.Nil))
      return astExpr.literal(null, this.previous().span);

    if (this.match(TokenType.Number, TokenType.String))
      return astExpr.literal(this.previous().literal, this.previous().span);

    if (this.match(TokenType.Identifier))
      return astExpr.variable(this.previous(), this.previous().span);

    if (this.match(TokenType.LeftParen)) {
      const start = this.previous().span.start;
      const expr = this.expression();
      const end = this.consume(
        TokenType.RightParen,
        "expect `)` after expression",
      ).span.end;
      return astExpr.grouping(expr, { start, end });
    }

    if (this.match(TokenType.If)) return this.ifExpression();

    // A block where an expression is expected is parsed as an expression
    if (this.match(TokenType.LeftBrace)) {
      return this.blockExpression();
    }

    throw this.error(this.peek(), "expect expression");
  }

  private ifExpression(): Expr {
    const start = this.previous().span.start;
    const condition = this.expression();
    this.consume(TokenType.LeftBrace, "expect '{' after if condition");

    const thenBranch = this.blockExpression();
    let end = thenBranch.span.end;
    let elseBranch: Expr | null = null;
    if (this.match(TokenType.Else)) {
      if (this.match(TokenType.If)) {
        elseBranch = this.ifExpression();
        end = elseBranch.span.end;
      } else {
        this.consume(TokenType.LeftBrace, "expect '{' or 'if' after 'else'");
        elseBranch = this.blockExpression();
        end = elseBranch.span.end;
      }
    }

    return astExpr.if_(condition, thenBranch, elseBranch, { start, end });
  }

  private blockExpression(): Expr {
    const start = this.previous().span.start;
    const { statements, value, end } = this.parseBlock();
    return astExpr.block(statements, value, { start, end });
  }

  private parseBlock(): {
    statements: (Stmt | null)[];
    value: Expr | null;
    end: Position;
  } {
    const statements: (Stmt | null)[] = [];
    let value: Expr | null = null;

    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      // Check for tokens indicating a statement
      if ([TokenType.LeftBrace, TokenType.Let].includes(this.peek().type)) {
        statements.push(this.declaration());
        continue;
      }

      // Parse an expression if unsure
      const expr = this.expression();

      // Check for semicolon
      if (this.match(TokenType.Semicolon)) {
        // Push the expression as an expression statement
        const end = this.previous().span.end;
        statements.push(
          astStmt.expression(expr, { start: expr.span.start, end }),
        );
      } else if (this.check(TokenType.RightBrace)) {
        // Set the value if the next token ends the block
        value = expr;
        break;
      }
    }

    const end = this.consume(
      TokenType.RightBrace,
      "expect '}' after block statements",
    ).span.end;
    return { statements, value, end };
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
