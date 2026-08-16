# Cantrip Grammar

> **Status**: Draft. This grammar is not final and will evolve while the parser is written.

## Overview

Cantrip mixes statements and expressions.

- Declarations and most control-flow constructs are statements.
- `if`, `loop`, `match`, and blocks are expressions (they produce a value).
- This makes the language more expression-oriented than a pure statement language.

## EBNF

```ebnf
program          = declaration* EOF ;

declaration      = fn_decl
                 | let_decl
                 | statement ;

fn_decl          = "fn" IDENTIFIER "(" parameters? ")" block ;

parameters       = IDENTIFIER ( "," IDENTIFIER )* ","? ;

let_decl         = "let" IDENTIFIER ( "=" expression )? ";" ;

statement        = expr_stmt
                 | return_stmt
                 | break_stmt
                 | continue_stmt
                 | while_stmt
                 | block ;               (* bare block as statement *)

expr_stmt        = expression ";" ;
return_stmt      = "return" expression? ";" ;
break_stmt       = "break" expression? ";" ;
continue_stmt    = "continue" ";" ;
while_stmt       = "while" expression block ;

(* -- Expressions (ordered by precedence, lowest to highest) --------------- *)

expression       = assignment ;

assignment       = ( call "." )? IDENTIFIER "=" assignment
                 | logic_or ;

logic_or         = logic_and ( "or" logic_and )* ;
logic_and        = equality ( "and" equality )* ;
equality         = comparison ( ( "!=" | "==" ) comparison )* ;
comparison       = term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
term             = factor ( ( "-" | "+" ) factor )* ;
factor           = unary ( ( "/" | "*" | "%" ) unary )* ;

unary            = ( "!" | "-" ) unary
                 | call ;

call             = primary ( "(" arguments? ")" | "[" expression "]" | "." IDENTIFIER )* ;
arguments        = expression ( "," expression )* ","? ;

primary          = "true" | "false" | "nil"
                 | NUMBER | STRING
                 | IDENTIFIER
                 | object | array
                 | "(" expression ")"
                 | if_expr
                 | loop_expr
                 | match_expr
                 | block ;               (* block as expression *)

object           = "{" ( field ( "," field )* ","? ) ? "}" ;
field            = ( IDENTIFIER | STRING ) ":" expression ;

array            = "[" ( expression ( "," expression )* ","? )? "]" ;

(* -- Expression forms ----------------------------------------------------- *)

if_expr          = "if" expression block ( "else" ( if_expr | block ) )? ;

loop_expr        = "loop" block ;

match_expr       = "match" expression "{" match_branch ( "," match_branch )* ","? "}" ;
match_branch     = expression "=>" expression ;

block            = "{" declaration* "}" ;
```

## Notes

### Design decisions (current)

| Construct                   | Statement? | Expression? | Notes                                                                     |
| --------------------------- | ---------- | ----------- | ------------------------------------------------------------------------- |
| `if`                        | no         | yes         | Value of the taken branch                                                 |
| `loop`                      | no         | yes         | Value produced by a `break` expression (or unit if the loop never breaks) |
| `while`                     | yes        | no          | Statement only for now                                                    |
| `match`                     | no         | yes         |                                                                           |
| `block`                     | yes        | yes         | Last expression becomes the block value                                   |
| `fn`                        | yes (decl) | no          | Declaration that produces a first-class value (closure)                   |
| `let`                       | yes (decl) | no          |                                                                           |
| `return`/`break`/`continue` | yes        | no          |                                                                           |

| Data Structure | Syntax         | Type           | Notes                               |
| -------------- | -------------- | -------------- | ----------------------------------- |
| Array          | `[elements]`   | Dynamic list   | Can be initialized without elements |
| Object         | `{key: value}` | Key-value pair | Can be initialized without fields   |

Function declarations/calls can have up to 255 parameters/arguments and the parser will push a parse error if this limit is broken.

### Open questions / deferred features

- `for` loops
- Pattern matching beyond simple `match` expressions (guards, destructuring, exhaustiveness)
- Anonymous / lambda functions (currently only named `fn` declarations)
- Multi-line and raw strings

### Source of truth

The grammar definitions and parsing behavior in the implementation are authoritative.
This document must be kept in sync with the code. When the parser changes, update this file in the same change.
