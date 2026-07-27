# Cantrip Lexer

The lexer (scanner) turns source text into a stream of tokens.  
It is the only (mostly) completed front-end component at the moment and serves as the source of truth for the token set.

## Tokens

| Type           | Lexeme / Pattern                 | Notes                             |
| -------------- | -------------------------------- | --------------------------------- |
| `LeftParen`    | `(`                              |                                   |
| `RightParen`   | `)`                              |                                   |
| `LeftBrace`    | `{`                              |                                   |
| `RightBrace`   | `}`                              |                                   |
| `LeftBracket`  | `[`                              |                                   |
| `RightBracket` | `]`                              |                                   |
| `Colon`        | `:`                              |                                   |
| `Comma`        | `,`                              |                                   |
| `Semicolon`    | `;`                              |                                   |
| `Arrow`        | `->`                             |                                   |
| `FatArrow`     | `=>`                             |                                   |
| `Bang`         | `!`                              |                                   |
| `BangEq`       | `!=`                             |                                   |
| `Eq`           | `=`                              |                                   |
| `EqEq`         | `==`                             |                                   |
| `Greater`      | `>`                              |                                   |
| `GreaterEq`    | `>=`                             |                                   |
| `Less`         | `<`                              |                                   |
| `LessEq`       | `<=`                             |                                   |
| `Minus`        | `-`                              |                                   |
| `MinusEq`      | `-=`                             |                                   |
| `Percent`      | `%`                              |                                   |
| `PercentEq`    | `%=`                             |                                   |
| `Plus`         | `+`                              |                                   |
| `PlusEq`       | `+=`                             |                                   |
| `Slash`        | `/`                              |                                   |
| `SlashEq`      | `/=`                             |                                   |
| `Star`         | `*`                              |                                   |
| `StarEq`       | `*=`                             |                                   |
| `Identifier`   | `[_a-zA-Z][_a-zA-Z0-9]*`         | See rules below                   |
| `String`       | `"..."`                          | Currently very simple (see notes) |
| `Number`       | `[0-9]+(\.[0-9]+)?`              | See rules below                   |
| `Else`         | `else`                           | Keyword                           |
| `False`        | `false`                          | Keyword                           |
| `Fn`           | `fn`                             | Keyword                           |
| `If`           | `if`                             | Keyword                           |
| `Let`          | `let`                            | Keyword                           |
| `Loop`         | `loop`                           | Keyword                           |
| `Nil`          | `nil`                            | Keyword                           |
| `Return`       | `return`                         | Keyword                           |
| `True`         | `true`                           | Keyword                           |
| `While`        | `while`                          | Keyword                           |
| `Eof`          | (always emitted at end of input) |                                   |

## Scanning Rules

### Identifiers and Keywords

- An identifier starts with a letter or underscore and continues with letters, digits, or underscores.
- The longest match is taken.
- After an identifier is recognized, it is checked against the keyword table. If it matches a keyword, the corresponding keyword token is emitted instead.

### Numbers

- Currently only decimal integers and simple floating-point numbers of the form `digits` or `digits.digits` are supported.
- The regex in the table above is approximate; the actual scanner should reject forms such as `1.` or `.5`.

### Strings

- Currently a very simple double-quoted string: anything between `"..."`.
- Escape sequences, multi-line strings, and raw strings are **not** yet defined. I plan to define escape sequences in the future, but the rest of the listed features are not gaurenteed.

### Operators

- Multi-character operators (`->`, `=>`, `!=`, `==`, `>=`, `<=`, `+=`, etc.) are recognized with maximal munch.
- Single-character operators are only emitted when a longer match is not possible.

### Whitespace and Comments

- Whitespace is ignored.
- Single-line comments are written with syntax `// ...`. These comments extend to the end of the line.
- Multi-line comments are planned, but not yet implemented. They will follow the syntax `/* ... */`.
- All comments are ignored by the scanner.

### Errors

- The scanner should produce a clear error (with source location) for:
  - Unterminated strings
  - Unexpected characters
  - Malformed numbers (once number rules are finalized)

## Source of Truth

The token definitions and scanning behavior in the implementation are authoritative.  
This document must be kept in sync with the code. When the scanner changes, update this file in the same change.
