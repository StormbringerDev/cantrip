# Cantrip Grammar

> **Status**: Draft. This grammar is not final and will evolve while the parser is written.

## Overview

Cantrip mixes statements and expressions.

- Declarations and most control-flow constructs are statements.
- `if`, `loop`, `match`, and blocks are expressions (they produce a value).
- This makes the language more expression-oriented than a pure statement language.

## EBNF

```ebnf
program          -> expression

// -- Expressions (ordered by precedence, lowest to highest) ---------------

expression       -> equality

equality         -> comparison ( ( "==" | "+" ) comparison )*
comparison       -> term ( ( ">" | ">=" | "<" | "<=" ) term )*
term             -> factor ( ( "-" | "+" ) factor )*
factor           -> unary ( ( "/" | "*" | "%" ) unary )*

unary            -> ( "!" | "-" ) unary
                  | primary

primary          -> "true" | "false" | "nil"
                  | NUMBER | STRING
                  | "(" expression ")"
```

## Notes

### Design decisions (current)

| Construct                   | Statement? | Expression? | Notes                                   |
| --------------------------- | ---------- | ----------- | --------------------------------------- |
| `if`                        | no         | yes         | Value of the taken branch               |
| `loop`                      | no         | yes         | Infinite loop; value from `break` later |
| `while`                     | yes        | no          | Statement only for now                  |
| `match`                     | no         | yes         |                                         |
| `block`                     | yes        | yes         | Last expression becomes the block value |
| `fn`                        | yes (decl) | no          | Not first-class yet                     |
| `let`                       | yes (decl) | no          |                                         |
| `return`/`break`/`continue` | yes        | no          |                                         |

### Open questions / deferred features

- Value-carrying `break` (currently just `break;`)
- `for` loops
- Array / list literals
- Map / object literals
- First-class functions / closures
- Pattern matching beyond simple `match` expressions
- Trailing commas in more places

### Source of truth

The grammar definitions and parsing behavior in the implementation are authoritative.
This document must be kept in sync with the code. When the parser changes, update this file in the same change.
