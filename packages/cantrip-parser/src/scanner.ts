import {
  diagnosticAt,
  type Diagnostic,
  type DiagnosticFromOptions,
  type Position,
} from "@cantrip/types";
import { Token, TokenType } from "@cantrip/ast";

// --- Character classification helpers --------------------------------

/**
 * @param char - Single character to test.
 * @returns `true` if the character is an ASCII digit (`0`-`9`).
 */
function isDigit(char: string): boolean {
  return char >= "0" && char <= "9";
}

/**
 * @param char - Single character to test.
 * @returns `true` if the character is an ASCII letter or underscore.
 */
function isAlpha(char: string): boolean {
  return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z") || char === "_";
}

/**
 * @param char - Single character to test.
 * @returns `true` if the character is alphanumeric or an underscore.
 */
function isAlphaNumeric(char: string): boolean {
  return isAlpha(char) || isDigit(char);
}

// --- Keyword lookup --------------------------------------------------

/**
 * Map from keyword lexemes to their corresponding {@link TokenType}.
 *
 * Any identifier that does not appear in this map is treated as a
 * regular `Identifier` token.
 */
const keywords = new Map<string, TokenType>();
keywords.set("and", TokenType.And);
keywords.set("break", TokenType.Break);
keywords.set("continue", TokenType.Continue);
keywords.set("else", TokenType.Else);
keywords.set("false", TokenType.False);
keywords.set("fn", TokenType.Fn);
keywords.set("if", TokenType.If);
keywords.set("let", TokenType.Let);
keywords.set("loop", TokenType.Loop);
keywords.set("match", TokenType.Match);
keywords.set("nil", TokenType.Nil);
keywords.set("or", TokenType.Or);
keywords.set("return", TokenType.Return);
keywords.set("true", TokenType.True);
keywords.set("while", TokenType.While);

/**
 * Error produced by the scanner when it encounters an unexpected character
 * or an unterminated string.
 */
export class ScannerError extends Error {
  /** Source position where the error was detected. */
  public readonly position: Position;

  /**
   * @param position - Location of the offending character / start of the string.
   * @param message - Human-readable description of the problem.
   */
  constructor(position: Position, message: string) {
    super(message);
    this.name = "ScannerError";
    this.position = position;
  }
}

export function fromScannerError(
  err: ScannerError,
  opts: DiagnosticFromOptions = {},
): Diagnostic {
  return diagnosticAt(err.message, err.position, {
    severity: "error",
    ...opts,
  });
}

/**
 * Hand-written lexer for the Cantrip language.
 *
 * Walks the source text character-by-character, producing a flat list of
 * {@link Token}s together with any lexical errors that were encountered.
 *
 * The scanner is responsible for:
 * - Recognizing all single- and multi-character operators
 * - Handling string literals (including common escape sequences)
 * - Parsing numeric literals (integers and floats)
 * - Identifying keywords versus ordinary identifiers
 * - Tracking accurate source positions (line / column / offset)
 */
export class Scanner {
  /** Complete source text being scanned. */
  private readonly source: string;
  /** Tokens produced so far. */
  private tokens: Token[] = [];
  /** Lexical errors collected during scanning. */
  private errors: ScannerError[] = [];
  /** Current 0-based line number. */
  private line = 0;
  /** Current 0-based column within the line. */
  private column = 0;
  /** Absolute character offset from the start of the source. */
  private offset = 0;

  /**
   * @param source - Source text to tokenize.
   */
  constructor(source: string) {
    this.source = source;
  }

  /**
   * Scan the entire source and return the token list plus any errors.
   *
   * A final `Eof` token is always appended.
   *
   * @returns Object containing the token array and the list of
   *          {@link ScannerError}s that occurred.
   */
  scanTokens(): { tokens: Token[]; scannerErrors: ScannerError[] } {
    while (!this.isAtEnd()) {
      this.scanToken();
    }

    this.tokens.push(
      new Token(TokenType.Eof, "", null, {
        start: {
          line: this.line,
          column: this.column++,
          offset: this.offset++,
        },
        end: {
          line: this.line,
          column: this.column,
          offset: this.offset,
        },
      }),
    );
    return { tokens: this.tokens, scannerErrors: this.errors };
  }

  /**
   * Consume the next character and dispatch to the appropriate
   * token-construction helper.
   */
  private scanToken() {
    const start: Position = {
      line: this.line,
      column: this.column,
      offset: this.offset,
    };
    const char = this.advance();
    switch (char) {
      case "(":
        this.addToken(TokenType.LeftParen, start);
        break;
      case ")":
        this.addToken(TokenType.RightParen, start);
        break;
      case "{":
        this.addToken(TokenType.LeftBrace, start);
        break;
      case "}":
        this.addToken(TokenType.RightBrace, start);
        break;
      case "[":
        this.addToken(TokenType.LeftBracket, start);
        break;
      case "]":
        this.addToken(TokenType.RightBracket, start);
        break;
      case ";":
        this.addToken(TokenType.Semicolon, start);
        break;
      case ":":
        this.addToken(TokenType.Colon, start);
        break;
      case ",":
        this.addToken(TokenType.Comma, start);
        break;
      case ".":
        this.addToken(TokenType.Dot, start);
        break;
      case "+":
        this.addToken(this.match("=") ? TokenType.PlusEq : TokenType.Plus, start);
        break;
      case "-":
        if (this.match("=")) {
          this.addToken(TokenType.MinusEq, start);
        } else if (this.match(">")) {
          this.addToken(TokenType.Arrow, start);
        } else {
          this.addToken(TokenType.Minus, start);
        }
        break;
      case "*":
        this.addToken(this.match("=") ? TokenType.StarEq : TokenType.Star, start);
        break;
      case "/":
        if (this.match("=")) {
          this.addToken(TokenType.SlashEq, start);
        } else if (this.match("/")) {
          while (this.peek() != "\n" && !this.isAtEnd()) this.advance();
        } else {
          this.addToken(TokenType.Slash, start);
        }
        break;
      case "%":
        this.addToken(this.match("=") ? TokenType.PercentEq : TokenType.Percent, start);
        break;
      case "!":
        this.addToken(this.match("=") ? TokenType.BangEq : TokenType.Bang, start);
        break;
      case "=":
        if (this.match("=")) {
          this.addToken(TokenType.EqEq, start);
        } else if (this.match(">")) {
          this.addToken(TokenType.FatArrow, start);
        } else {
          this.addToken(TokenType.Eq, start);
        }
        break;
      case "<":
        this.addToken(this.match("=") ? TokenType.LessEq : TokenType.Less, start);
        break;
      case ">":
        this.addToken(this.match("=") ? TokenType.GreaterEq : TokenType.Greater, start);
        break;
      case '"':
        this.addString(start);
        break;
      // Ignore whitespace
      case " ":
      case "\r":
      case "\t":
        break;
      case "\n":
        this.line++;
        this.column = 1;
        break;
      default:
        if (isDigit(char)) {
          this.addNumber(start);
        } else if (isAlpha(char)) {
          this.addIdentifier(start);
        } else {
          this.errors.push(new ScannerError(start, `Unexpected character '${char}'.`));
        }
    }
  }

  // --- Token construction helpers ------------------------------------

  /**
   * Create a token of the given type whose lexeme spans from `start`
   * to the current scanner position.
   *
   * @param type - Token kind.
   * @param start - Position where the token began.
   * @param literal - Optional literal value (numbers and strings).
   */
  private addToken(type: TokenType, start: Position, literal?: number | string) {
    const end: Position = {
      line: this.line,
      column: this.column,
      offset: this.offset,
    };
    const text = this.source.substring(start.offset, end.offset);
    this.tokens.push(new Token(type, text, literal ?? null, { start, end }));
  }

  /**
   * Scan a numeric literal (integer or floating-point).
   *
   * @param start - Position of the first digit.
   */
  private addNumber(start: Position) {
    while (isDigit(this.peek())) this.advance();

    // Look for decimal point
    if (this.peek() === "." && isDigit(this.peekNext())) {
      // Consume the decimal point
      this.advance();

      // Advance through the rest of the number
      while (isDigit(this.peek())) this.advance();
    }

    // Record end position to determine number value
    const end: Position = {
      line: this.line,
      column: this.column,
      offset: this.offset,
    };
    this.addToken(
      TokenType.Number,
      start,
      parseFloat(this.source.substring(start.offset, end.offset)),
    );
  }

  /**
   * Scan a double-quoted string literal, handling common escape sequences.
   *
   * Supported escapes: `\n`, `\t`, `\"`, `\\`, `\0`.
   * Any other escape is preserved literally (including the backslash).
   *
   * @param start - Position of the opening quote.
   */
  private addString(start: Position) {
    let value = "";

    while (this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() == "\n") {
        this.line++;
        this.column = 1;
      }

      // Process escape sequences
      if (this.match("\\")) {
        switch (this.peek()) {
          case "n":
            value += "\n";
            break;
          case "t":
            value += "\t";
            break;
          case '"':
            value += '"';
            break;
          case "\\":
            value += "\\";
            break;
          case "0":
            value += "\0";
            break;
          default:
            value += `\\${this.peek()}`;
        }
      } else {
        value += this.peek();
      }

      this.advance();
    }

    if (this.isAtEnd()) {
      this.errors.push(new ScannerError(start, "Unterminated string."));
    }

    // Consume closing quote
    this.advance();

    this.addToken(TokenType.String, start, value);
  }

  /**
   * Scan an identifier or keyword.
   *
   * The longest alphanumeric sequence (including underscores) is consumed;
   * if it matches a reserved word the corresponding keyword token is emitted,
   * otherwise an `Identifier` token is produced.
   *
   * @param start - Position of the first character of the identifier.
   */
  private addIdentifier(start: Position) {
    // Continue to consume characters until a non alphanumeric character is encountered
    while (isAlphaNumeric(this.peek())) this.advance();

    const end: Position = {
      line: this.line,
      column: this.column,
      offset: this.offset,
    };
    const text = this.source.substring(start.offset, end.offset);
    let type = keywords.get(text);
    type ??= TokenType.Identifier;
    this.addToken(type, start);
  }

  // --- Low-level character helpers -----------------------------------

  /**
   * @returns `true` when the scanner has reached the end of the source.
   */
  private isAtEnd(): boolean {
    return this.offset >= this.source.length;
  }

  /**
   * Consume and return the current character, advancing the cursor.
   *
   * @returns The character that was just consumed
   */
  private advance(): string {
    this.column++;
    return this.source.charAt(this.offset++);
  }

  /**
   * Conditionally consume the next character if it matches `expected`
   *
   * @param expected - Character that must be present.
   * @returns `true` if the character was matched and consumed.
   */
  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.offset) != expected) return false;

    this.column++;
    this.offset++;
    return true;
  }

  /**
   * Look at the current character without consuming it.
   *
   * @returns The character at the current offset, or `""` at end-of-file.
   */
  private peek(): string {
    if (this.isAtEnd()) return "";
    return this.source.charAt(this.offset);
  }

  /**
   * Look one character ahead of the current position.
   *
   * @returns The character at `offset + 1`, or `""` if that would be past the end.
   */
  private peekNext(): string {
    if (this.offset + 1 >= this.source.length) return "";
    return this.source.charAt(this.offset + 1);
  }
}
