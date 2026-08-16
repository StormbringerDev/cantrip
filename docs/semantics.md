# Cantrip Semantics

> **Status**: Feature-complete.  
> This document describes the evaluation rules of the current TypeScript tree-walking interpreter.

The interpreter (`packages/cantrip-interpreter`) is the source of truth for runtime behavior. This file must stay in sync with it.

## Runtime Values

At runtime every value belongs to one of these types:

| Cantrip type     | TypeScript representation    | Notes                                                          |
| ---------------- | ---------------------------- | -------------------------------------------------------------- |
| `nil`            | `null`                       | The only falsy non-boolean value                               |
| `bool`           | `boolean`                    | `true` / `false`                                               |
| `number`         | `number`                     | IEEE-754 double (JS number)                                    |
| `string`         | `string`                     |                                                                |
| array            | `RuntimeValue[]`             | Dynamic, heterogeneous list                                    |
| object           | `Map<string, RuntimeValue>`  | String keys only                                               |
| unit type (`()`) | `Symbol.for("cantrip.unit")` | Returned implicitly when no value is produced by an expression |

There is currently **no** distinction between integers and floats; both are just `number`.

Unit is produced by: empty blocks, functions with no final expression / bare `return`, bare `break`, and native functions such as `print`.

## Expression vs Statement

In Cantrip, an expression is any construct that produces a value such as the basic arithmetic, comparison, and logic expressions. `if`, `loop`, and `match` constructs are also expressions. A statement is any construct that creates side effects or binds a value to a scope. An expression followed by a `;` is a statement. `while`, `break`, `continue`, and `return` constructs are also statements. `let` and `fn` declarations are statements that bind values to the current scope. Block constructs (`{ ... }`) can be used as both statements and expressions.

## Scoping

Cantrip uses lexical scoping for variable resolution. Any variables declared inside blocks will take precedence for any expression inside the same block. If a variable with the same name exists in an outer scope, it is shadowed by the inner variable.

```cantrip
let x = 5;
{
  let x = 12;
  print(x); // prints "12"
}
print(x); // prints "5"
```

## Truthiness

Used by `!`, `and`, and `or`:

- `nil` (`null`) -> falsy
- unit type (`()`) -> falsy
- `false` -> falsy
- Everything else (`true`, numbers including `0`, strings including `""`, arrays, objects) -> truthy

```cantrip
!nil        // true
!false      // true
!()         // true
!0          // false
!""         // false
![]         // false
!{}         // false
```

## Stringification

Used by the + operator when either operand is a string:

- `nil` -> the string `"nil"`
- arrays -> `[stringified value, ...]` or `[]`
- objects -> `{ key: stringified value, ... }` or `{}`
- unit type -> `()`
- all other values -> result of calling `.toString()` on them

## Implemented Expressions

### Literals

| Form                 | Runtime result                           |
| -------------------- | ---------------------------------------- |
| `42`, `3.14`         | number                                   |
| `"hello"`            | string                                   |
| `true` / `false`     | boolean                                  |
| `nil`                | `null`                                   |
| `[expr, ...]`        | array (elements evaluated left-to-right) |
| `{ key: expr, ... }` | object (`Map`)                           |

Empty arrays `[]` and empty objects `{}` are valid.

### Grouping

`( expression )` simply evaluates the inner expression and returns its value.

### Unary operators

| Operator | Meaning          | Notes                     |
| -------- | ---------------- | ------------------------- |
| `!`      | Logical not      | `!isTruthy(operand)`      |
| `-`      | Numeric negation | Operand is cast to number |

### Binary operators

Operators are left-associative and follow the precedence defined in the [grammar](./grammar.md).

#### Arithmetic

| Operator | Behavior                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------- |
| `+`      | If either operand is a string -> string concatenation (via stringify). Otherwise numeric addition. |
| `-`      | Numeric subtraction                                                                                |
| `*`      | Numeric multiplication                                                                             |
| `/`      | Numeric division                                                                                   |
| `%`      | Numeric remainder                                                                                  |

#### Comparison (numeric)

| Operator | Behavior         |
| -------- | ---------------- |
| `>`      | greater than     |
| `>=`     | greater or equal |
| `<`      | less than        |
| `<=`     | less or equal    |

Operands are currently cast to number; non-numeric operands produce JS-style results and should be considered undefined behavior for now.

#### Equality

| Operator | Behavior                  |
| -------- | ------------------------- |
| `==`     | Strict equality (`===`)   |
| `!=`     | Strict inequality (`!==`) |

No type coercion is performed.

#### Logical (short-circuit)

| Operator | Behavior                                                                                   |
| -------- | ------------------------------------------------------------------------------------------ |
| `or`     | Evaluates left. If truthy, returns left without evaluating right. Otherwise returns right. |
| `and`    | Evaluates left. If falsy, returns left without evaluating right. Otherwise returns right.  |

Both operators return the actual operand value, **not** a coerced boolean.

```cantrip
false or 42          // 42
nil or "hello"       // "hello"
true and 0           // 0
"hi" and false       // false
```

### Variable reference

Referencing a named variable will retrieve that variable's value if it exists in the current or an outer scope.

### Assignment operators

| Operator | Behavior                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------- |
| `=`      | Assigns the value on the right to the variable on the left if the variable has been previously declared |
| `+=`     | Adds the right value to the variable value before assigning                                             |
| `-=`     | Subtracts the right value from the variable before assigning                                            |
| `*=`     | Multiplies the variable value by the right value before assigning                                       |
| `/=`     | Divides the variable value by the right value before assigning                                          |
| `%=`     | Divides the variable value by the right value and assigns the remainder                                 |

The left-hand side of the expression must have been previously declared.

### Block expressions

Blocks (`{ ... }`) create a lexical scope where local variables can be declared. If the final expression is not terminated by a semicolon (`;`), that expression's value is returned by the block. If there is no final expression, the block implicitly returns a unit type.

```cantrip
let x = {
  let y = 5;
  y + 5 // The result is this block's returned value.
};

let y = {
  "Value discarded"; // Absence of final expression returns unit type.
}
```

### Get expressions

A get expression (`object.field`) retrieves the value of the object's field.

### Set expressions

A set expression (`object.field = value`) sets the field to the value to the right of the operator.  
Planned to work with any compound assignment operator (`+=`, `-=`, etc.).

### Index expression

An index expression (`array[index]`) retrieves the array element at the given index. You can use this expression to retrieve an object field's value if the expression inside the brackets evaluates to a string of one of the object's keys.

### Index set expression

An index set expression (`array[index] = value`) sets the element at the given index to the given value. You can use this expression to assign an object field's value if the expression inside the brackets evaluates to a string of one of the object's keys.  
Planned to work with any compound assignment operator (`+=`, `-=`, etc.).

### Call expressions

A call expression (`function(args)`) retrieves a function from the environment (either current or an enclosing environment), assigns the arguments to each parameter in the same order the parameters were previously declared, and executes the function body.  
The number of arguments must match the function's arity; otherwise a runtime error is raised.

### If expressions

First, the condition following the `if` keyword gets evaluated. If it is truthy, the block expression following the condition is evaluated. Otherwise, the block gets skipped and if an else branch exists, either a block expression or another if expression, it gets evaluated. The if expression returns the result of the taken branch.

```cantrip
if flag {
  5 + 5 // This value gets returned if `flag` is truthy.
} else {
  2 + 2 // This value gets returned otherwise.
}
```

### Loop expressions

A `loop` expression repeatedly evaluates its body until a `break` is executed.

- `break;` (or a bare `break` with no value) makes the loop expression evaluate to unit.
- `break expr;` makes the loop expression evaluate to the value of `expr`.
- If the loop never breaks, it currently yields unit (this is the present dynamic behavior).

### Match expressions

A match expression checks an expression's value to see if it matches one of the listed values. If a match is found, the result of the expression to the right of that value's arrow (`=>`) is returned by the match expression. If not, the default case (`_`) is returned. Until static analysis is implemented, match expressions are to be considered experimental.

## Implemented Statements

### Variable declarations

Declares a variable in the current scope and assigns it a value or `nil` if the initializer is not present.  
All variables are mutable.

```cantrip
let x = 42;
let answers;
```

### Function declarations

`fn name(params) { ... }` creates a first-class function value and binds it in the current environment.

- The function body is a block expression; the value of the final expression (or an explicit `return`) becomes the return value. If neither is present the function returns unit.
- Parameters are local to the function body.
- Functions are **lexical closures**: they capture the environment that was active at the point of declaration. Nested functions and functions returned from other functions therefore close over their defining scope.
- Recursion works (a function may call itself by name).
- Functions are first-class: they may be stored in variables, passed as arguments, and returned from other functions.

```cantrip
fn add(a, b) {
  a + b // Implicitly returns the result
}
```

### Block statements

Blocks (`{ ... }`) create a lexical scope where local variables can be declared. As statements, blocks discard the final expression's value regardless of its presence.

```cantrip
{
  let x = 5;
  x + 5 // As a statement, the value is discarded
}
```

### Expression statements

These statements produce side-effects if applicable, and discard any returned values.

```cantrip
x = 42;
print(x);
```

### Return statements

These statements end the execution of a function early and return the value following `return` if present or the unit type otherwise.

### Break statements

These statements exit out of the immediately enclosing loop. Break statements can return values from `loop` expressions.

### Continue statements

These statements skip the current run of the immediately enclosing loop. Unlike `break`, `continue` restarts the loop at the beginning.

### While statements

A while loop executes the block after the condition expression if the condition is truthy. On each iteration of the loop, the condition is evaluated for truthiness and the loop is exited if the condition is falsy.

## Standard Library

A minimal set of native functions is injected into the global environment:

| Name    | Arity | Behavior                                                 |
| ------- | ----- | -------------------------------------------------------- |
| `print` | 1     | Writes its argument to the host console and returns unit |
| `time`  | 0     | Returns milliseconds since the Unix epoch                |

Additional native functions will be added cautiously; the design goal remains a small core.

## Not yet implemented / incomplete

- Comprehensive runtime error reporting for every possible type mismatch and undefined-variable case
- Compound assignment (`+=`, etc.) on object fields and array indices
- Exhaustive / type-aware `match` (currently minimal and purely dynamic)

## Evaluation model (current)

1. The interpreter receives a list of statements from the parser.
2. `interpret(statements)` walks through the list of statements and executes them one by one with `accept(this)` (visitor pattern).
3. Individual expressions are evaluated by calling `accept(this)` on the AST node.
4. The global environment is pre-populated with the tiny standard library (`print`, `time`). User declarations are added on top of it.

Source of truth

- Implementation: `packages/cantrip-interpreter/src/interpreter.ts`
- Tests: `packages/cantrip-interpreter/tests/interpreter.test.ts`

When the interpreter gains new behaviour, update this document in the same change.
