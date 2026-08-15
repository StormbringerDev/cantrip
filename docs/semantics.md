# Cantrip Semantics

> **Status**: Partial.  
> This document describes the evaluation rules of the current TypeScript tree-walking interpreter.  
> Only the constructs that are implemented and covered by tests are specified in detail.  
> Everything else is listed under "Not yet implemented".

The interpreter (`packages/cantrip-interpreter`) is the source of truth for runtime behavior. This file must stay in sync with it.

## Runtime Values

At runtime every value belongs to one of these types:

| Cantrip type | TypeScript representation   | Notes                            |
| ------------ | --------------------------- | -------------------------------- |
| `nil`        | `null`                      | The only falsy non-boolean value |
| `bool`       | `boolean`                   | `true` / `false`                 |
| `number`     | `number`                    | IEEE-754 double (JS number)      |
| `string`     | `string`                    |                                  |
| array        | `RuntimeValue[]`            | Dynamic, heterogeneous list      |
| object       | `Map<string, RuntimeValue>` | String keys only                 |

There is currently **no** distinction between integers and floats; both are just `number`.

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
- `false` -> falsy
- Everything else (`true`, numbers including `0`, strings including `""`, arrays, objects) -> truthy

```cantrip
!nil        // true
!false      // true
!0          // false
!""         // false
![]         // false
!{}         // false
```

## Stringification

Used by the + operator when either operand is a string:

- `nil` -> the string `"nil"`
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

### Block expressions

Blocks (`{ ... }`) create a lexical scope where local variables can be declared. If the final expression is not terminated by a semicolon (`;`), that expression's value is returned by the block.

```cantrip
let x = {
  let y = 5;
  y + 5 // The result is this block's returned value.
};
```

### Get expressions

Get expressions (`object.field`) retrieves the value of the object's field.

### Set expressions

Set expressions (`object.field = value`) sets the field to the value to the right of the operator.  
Planned to work with any compound assignment operator (`+=`, `-=`, etc.).

### Index expression

Index expressions (`array[index]`) retrieves the array element at the given index. You can use this expression to retrieve an object field's value if the expression inside the brackets evaluates to a string of one of the object's keys.

### Index set expression

Index set expressions (`array[index] = value`) sets the element at the given index to the given value. You can use this expression to assign an object field's value if the expression inside the brackets evaluates to a string of one of the object's keys.  
Planned to work with any compound assignment operator (`+=`, `-=`, etc.).

### If expressions

First, the condition following the `if` keyword gets evaluated. If it is truthy, the block expression following the condition is evaluated. Otherwise, the block gets skipped and if an else branch exists, either a block expression or another if expression, it gets evaluated. If statements return the result of the block expression that is evaluated.

```cantrip
if flag {
  5 + 5 // This value gets returned if `flag` is truthy.
} else {
  2 + 2 // This value gets returned otherwise.
}
```

### Loop expressions

A loop expression executes the block following the `loop` keyword repeatedly. These loops must be exited manually with a break statement. In the future, loop expressions will return a value via break statement.

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

### Break statements

These statements exit out of the immediately enclosing loop. Break statements can return values from `loop` expressions.

### Continue statements

These statements skip the current run of the immediately enclosing loop. Unlike `break`, `continue` restarts the loop at the beginning.

### While statements

A while loop executes the block after the condition expression if the condition is truthy. On each iteration of the loop, the condition is evaluated for truthiness and the loop is exited if the condition is falsey.

## Not yet implemented

- Functions (`fn`)
- `return`
- Any standard library (`print`, etc.)
- Runtime error reporting (type errors, undefined variables, ...)

Until these are implemented, programs that use them will not execute correctly.

## Evaluation model (current)

1. The interpreter receives a list of statements from the parser.
2. `interpret(statements)` walks through the list of statements and executes them one by one with `accept(this)` (visitor pattern).
3. Individual expressions are evaluated by calling `accept(this)` on the AST node.
4. The global environment is empty until variables are declared. Environments created by blocks contain a reference to the immediately enclosing environment.

Source of truth

- Implementation: `packages/cantrip-interpreter/src/interpreter.ts`
- Tests: `packages/cantrip-interpreter/tests/interpreter.test.ts`

When the interpreter gains new behaviour, update this document in the same change.
