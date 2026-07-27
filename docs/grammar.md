# Cantrip Grammar

## EBNF Grammar

```
program          -> declaration* EOF

declaration      -> fn_decl
                  | let_decl
                  | statement

fn_decl          -> "fn" IDENTIFIER "(" parameters? ")" block

parameters       -> IDENTIFIER ( "," IDENTIFIER )*

let_decl         -> "let" IDENTIFIER ( "=" expression )? ";"

statement        -> expr_stmt
                  | return_stmt
                  | while_stmt
                  | block

expr_stmt        -> expression ";"
return_stmt      -> "return" expression? ";"
while_stmt       -> "while" expression block

expression       -> assignment

assignment       -> IDENTIFIER "=" assignment
                  | logic_or

logic_or         -> logic_and ( "or" logic_and )*
logic_and        -> equality ( "and" equality )*
equality         -> comparison ( ( "!=" | "==" ) comparison )*
comparison       -> term ( ( ">" | ">=" | "<" | "<=" ) term )*
term             -> factor ( ( "-" | "+" ) factor )*
factor           -> unary ( ( "/" | "*" | "%" ) unary )*

unary            -> ( "!" | "-" ) unary
                  | call

call             -> primary ( "(" arguments? ")" )*
arguments        -> expression ( "," expression )*

primary          -> "true" | "false" | "nil"
                  | NUMBER | STRING
                  | IDENTIFIER
                  | "(" expression ")"
                  | if_expr
                  | loop_expr
                  | block

if_expr          -> "if" expression block ( "else" ( if_expr | block ) )?

loop_expr        -> "loop" block

block            -> "{" declaration* "}"
```

Note: Above grammar is not final and is subject to change while writing the parser.
