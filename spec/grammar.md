# Cantrip Grammar

This document describes the syntax and lexical rules of Cantrip.

## Syntax

```ebnf
program      = declaration* EOF ;

declaration  = fnDecl
             | letDecl
             | statement ;

fnDecl       = "fn" IDENTIFIER "(" parameters? ")" block ;
letDecl      = "let" IDENTIFIER ( "=" expression )? ";" ;

statement    = exprStmt
             | breakStmt
             | continueStmt
             | returnStmt
             | whileStmt
             | block ;

exprStmt     = expression ";" ;
breakStmt    = "break" ";" ;
continueStmt = "continue" ";" ;
returnStmt   = "return" expression? ";" ;
whileStmt    = "while" expression block ;

expression   = assignment ;

assignment   = IDENTIFIER "=" assignment
             | logic_or ;

logic_or     = logic_and ( "or" logic_and )* ;
logic_and    = equality ( "and" equality )* ;
equality     = comparison ( ( "!=" | "==" ) comparison )* ;
comparison   = term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
term         = factor ( ( "+" | "-" ) factor )* ;
factor       = unary ( ( "*" | "/" | "%" ) unary )* ;

unary        = ( "!" | "-" ) unary | call ;
call         = primary ( "(" arguments? ")" )* ;
primary      = "true" | "false" | "nil"
             | NUMBER | STRING | IDENTIFIER | "(" expression ")"
             | ifExpr | fnExpr | block ;

ifExpr       = "if" expression block ( "else" ( block | ifExpr ) )? ;
fnExpr       = "fn" "(" parameters? ")" block ;
block        = "{" declaration* "}" ;

parameters   = IDENTIFIER ( "," IDENTIFIER )* ","? ;
arguments    = expression ( "," expression )* ","? ;

NUMBER       = DIGIT+ ( "." DIGIT+ )? ;
STRING       = "\"" <any char except "\"">* "\"" ;
IDENTIFIER   = ALPHA ( ALPHA | DIGIT )* ;
ALPHA        = "a" - "z" | "A" - "Z" | "_" ;
DIGIT        = "0" - "9" ;
```

## Comments

Comments in Cantrip follow C's syntax: `//` for single-line comments and `/* ... */` for block comments. Block comments cannot nest.

## Keywords

These are the words that are currently reserved by Cantrip.

| Keyword    | Purpose                                                                                |
| ---------- | -------------------------------------------------------------------------------------- |
| `and`      | Logical and operator                                                                   |
| `break`    | Early exit from the immediately enclosing loop                                         |
| `continue` | Skip to the beginning of the immediately enclosing loop                                |
| `else`     | Alternative branch for `if`                                                            |
| `false`    | Literal boolean value "false"                                                          |
| `fn`       | Declare named functions (`fn ident() { ... }`) or anonymous functions (`fn() { ... }`) |
| `if`       | Conditional expressions                                                                |
| `let`      | Declaring mutable variables                                                            |
| `nil`      | Literal null value                                                                     |
| `or`       | Logical or operator                                                                    |
| `return`   | Return from a function early with optional expression value                            |
| `true`     | Literal boolean value "true"                                                           |
| `while`    | Loop against an expression condition                                                   |
