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

parameters       = IDENTIFIER ( "," IDENTIFIER )* ;

let_decl         = "let" IDENTIFIER ( "=" expression )? ";" ;

statement        = expr_stmt
                 | return_stmt
                 | break_stmt
                 | continue_stmt
                 | while_stmt
                 | block ;               (* bare block as statement *)

expr_stmt        = expression ";" ;
return_stmt      = "return" expression? ";" ;
break_stmt       = "break" ";" ;         (* value-carrying break is deferred *)
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

call             = primary ( "(" arguments? ")" | "." IDENTIFIER )* ;
arguments        = expression ( "," expression )* ;

primary          = "true" | "false" | "nil"
                 | NUMBER | STRING
                 | IDENTIFIER
                 | array | object
                 | "(" expression ")"
                 | if_expr
                 | loop_expr
                 | match_expr
                 | block ;               (* block as expression *)

object           = "{" ( field ( "," field )* ","? )? "}" ;
field            = ( IDENTIFIER | STRING ) ":" expression ;

array            = "[" ( expression ( "," expression )* ","? )? "]" ;

(* -- Expression forms ----------------------------------------------------- *)

if_expr          = "if" expression block ( "else" ( if_expr | block ) )? ;

loop_expr        = "loop" block ;

match_expr       = "match" expression "{" match_branch* "}" ;
match_branch     = expression "=>" expression ","? ;

block            = "{" declaration* "}" ;
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

| Data Structure | Syntax         | Type           | Notes                               |
| -------------- | -------------- | -------------- | ----------------------------------- |
| Array          | `[elements]`   | Dynamic list   | Can be initialized without elements |
| Object         | `{key: value}` | Key-value pair | Can be initialized without fields   |

### Open questions / deferred features

- Value-carrying `break` (currently just `break;`)
- `for` loops
- Array / list literals
- Map / object literals
- First-class functions / closures
- Pattern matching beyond simple `match` expressions
- Trailing commas in more places

### Source of truth

This document serves as reference for the planned syntax structure of Cantrip.  
It is purely aspirational and will not be a complete source of truth for the current status of the parser.
