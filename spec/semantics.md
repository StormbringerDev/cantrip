# Cantrip Semantics

This document describes the semantics of Cantrip.

## Data Types

- `number`: a 64-bit floating point number representable as either an integer (`42`) or a floating point number (`3.14`)
- `string`: a collection of characters enclosed in quotes (`"` or `'`)
- `boolean`: a value of either `true` or `false`
- `nil`: a value indicating the deliberate absence of useful data
- unit type (`()`): the value implicitly returned when no explicit return is present
- functions: values that contain code to be executed on invokation

## Truthiness and Falsiness

The model for what is considered truthy or falsey in Cantrip is as follows:

- Unit type: falsey
- `nil`: falsey
- `false`: falsey
- `true`: truthy
- `0`: falsey
- Number > 0: truthy
- `""` (empty string): falsey
- String with value: truthy

```go
!()    // true
!nil   // true
!false // true
!true  // false
!0     // true
!42    // false
!""    // true
!"Hi!" // false
```

## Scoping

Cantrip is lexically scoped, meaning a block construct creates a new scope and any variables declared within are discarded when the scope ends. A value from an outer scope can be accessed from an inner scope. If a variable in an inner scope has the same name as one in an outer scope, the outer variable is shadowed by the inner one.

```javascript
const a = "global a";
const b = "global b";
const c = "global c";
{
  const a = "outer a";
  const b = "outer b";
  {
    const a = "inner a";
    print(a); // prints "inner a"
    print(b); // prints "outer b"
    print(c); // prints "global c"
  }
  print(a); // prints "outer a"
  print(b); // prints "outer b"
  print(c); // prints "global c"
}
print(a); // prints "global a"
print(b); // prints "global b"
print(c); // prints "global c"
```

## Expressions

An expression in cantrip is anything that returns a value. Expressions may have side effects such as changing the value of a variable or calling a function that can also produce side effects.

### Precedence (Lowest to Highest)

| Expression  | Example(s)                                                       |
| ----------- | ---------------------------------------------------------------- |
| Assignment  | `ident = expr`                                                   |
| Logical Or  | `expr or expr`                                                   |
| Logical And | `expr and expr`                                                  |
| Equality    | `expr == expr`, `expr != expr`                                   |
| Comparison  | `expr > expr`, `expr <= expr`                                    |
| Term        | `expr + expr`, `expr - expr`                                     |
| Factor      | `expr * expr`, `expr / expr`                                     |
| Unary       | `-expr`, `!expr`                                                 |
| Call        | `expr()`, `add(1, 2)`                                            |
| Primary     | literals (numbers, `true`, etc.), variables, if expression, etc. |

### Assignment

Assignment expressions (`x = 42`) change the value of an existing variable. If the target variable was declared with `const`, assignment will fail. Assignment is left associative; therefore, you can assign multiple variables in a chain: `a = b = c`. In this example, `a` will be the last variable to be assigned and it will be assigned with the final value of `b`.

### Binary Expressions

#### Operators

| Operator | Performed Operation                           | Returns             |
| -------- | --------------------------------------------- | ------------------- |
| `or`     | Logical 'or' expression                       | left or right value |
| `and`    | Logical 'and' expression                      | left or right value |
| `!=`     | Check for inequality                          | boolean             |
| `==`     | Check for equality                            | boolean             |
| `>`      | Greater than                                  | boolean             |
| `>=`     | Greater than or equal to                      | boolean             |
| `<`      | Less than                                     | boolean             |
| `<=`     | Less than or equal to                         | boolean             |
| `+`      | Mathematical addition or string concatenation | number              |
| `-`      | Mathematical subtraction                      | number              |
| `*`      | Mathematical multiplication                   | number              |
| `/`      | Mathematical division                         | number              |
| `%`      | Remainder of division                         | number              |

#### Logical 'or' & 'and'

These two operators are special cases in that they short circuit. For `or`, if the left value is [truthy](#truthiness-and-falseyness),the left value is returned and the right side is not evaluated. Otherwise, it returns the value on the right. `and` is the opposite.

### Block Expressions

Blocks are a special construct that can act as either an expression or a statement depending on their location. Blocks carry a series of statements that are executed in order. Block expressions can return a value if an expression is included at the end without a semicolon (`;`). If this value is omitted, the block implicitly returns the unit type (`()`).

```rust
let y = {
  let x = 5;
  x + 5  // This block returns 10
}
```

### Call Expressions

Function call expressions pull a [function value](#function-expressions) and execute the function body. Arguments are passed to the function from parentheses. Before executing the function body, the interpreter checks if the number of arguments matches the number of arguments the function accepts. If too many or too few arguments are passed, the interpreter emits a runtime error.

```javascript
add(1, 2);
```

### Function Expressions

Anonymous functions can be created with the following syntax: `fn(params) { ... }`. The block following the function parameters is evaluated as a [block expression](#block-expressions). Before execution, a new environment for the function is created and arguments from a [call expression](#call-expressions) are passed to the parameters in order from left to right.

```rust
const add = fn(a, b) { a + b }
```

### If Expressions

`if` constructs are considered expressions in Cantrip. First, the if condition is evaluated. If it is [truthy](#truthiness-and-falseyness), the block following the condition is evaluated and returned. If there is an `else` clause, that expression is evaluated if the condition is falsey. The `else` clause can be a [block expression](#block-expressions) or another if statement.

```rust
if flag1 { 1 } else if flag2 { 2 } else { 3 }
```

### Grouping Expressions

Expressions can be grouped with parentheses to override normal precedence rules. For example, `1 + 2 * 3` evaluates the multiplication first while `(1 + 2) * 3` evaluates the addition first.

### Literal Expressions

Literals can take the form of numbers (`123`, `3.14`), strings (`"Hello!"`, `'Hi!'`), boolean `true` and `false`, or `nil`. The unit type (`()`) can't be directly invoked in an expression (yet), but it is implicitly returned by any expression that doesn't explicitly return a value.

### Unary Expressions

#### Operators

| Operator | Performed Operation   | Returns |
| -------- | --------------------- | ------- |
| `-`      | Mathematical negation | number  |
| `!`      | Logical 'not'         | boolean |

#### Logical 'not'

The prefix `!` operator returns `true` if the value is [falsey](#truthiness-and-falseyness) and `false` otherwise.

### Variable Expressions

Variable expressions attempt to retrieve the value associated with the identifier. If no variable with the name exists, the interpreter emits a runtime error.

```javascript
let a = 15;

let b = a; // Retrieves the value '15'
```

## Statements

A statement in Cantrip is a construct that modifies the state of the program or produces side effects. Statements are usually terminated by a semicolon (`;`). Statements do not return values.

### Declarations

Declarations are special types of statements that bind values to names.

#### Const Declarations

`const` declaration statements bind a value to an identifier. Variables declared with `const` are immutable and cannot be assigned to after creation.

```javascript
const maxRuns = 10;
```

#### Let Declarations

`let` declaration statements bind a value to an identifier. Variables declared with `let` are mutable and can be reassigned at any time after creation.

```javascript
let i = 0;
```

#### Function Declarations

Functions can be declared using `fn` followed by an identifier. Functions can be invoked directly with [call expressions](#call-expressions) or passed around as values.

```rust
fn add(a, b) {
  a + b
}
```

### Block Statements

Blocks are a special construct that can act as either an expression or a statement depending on their location. Blocks carry a series of statements that are executed in order. Unlike [block expressions](#block-expressions), block statements do not evaluate the final value, even though it still parses as valid code, and block statements do not return a value.

```rust
{
  let x = 42;
  print(x);
  x // Value is ignored by the interpreter
}
```

### Break Statements

Break statements allow for an early exit from a loop. A `break` outside of a loop will emit a resolution error.

```javascript
let i = 0;

while true {
  i = i + 1;
  print(i);
  if i == 5 {
    break;
  }
}
```

### Continue Statements

Continue statements within a loop will skip from the `continue` to the beginning of the loop. A `continue` outside of a loop will emit a resolution error.

```javascript
let i = 0;

while i < 10 {
  if i == 5 {
    i = i + 1
    continue;
  }
  i = i + 1;
  print(i);
}
```

### Expression Statements

Expression statements are simply an expression followed by a semicolon (`;`). Any evaluated values are discarded. These statements are used primarily for their side effects.

```javascript
x = 42;
print(x);
```

### Return Statements

Return statements allow for an early return from a [function](#function-declarations). Return statements can carry an expression as the value to be returned from the function, returning unit when the expression is omitted. A `return` outside of a function will emit a resolution error.

```rust
fn isEven(n) {
  if n == 0 {
    return true;
  }
  if n == 1 {
    return false;
  }
  isEven(n)
}
```

### While Statements

While statements execute the body following a condition so long as the condition is [truthy](#truthiness-and-falsiness).

```javascript
let i = 0;

while i < 5 {
  i = i + 1;
  print(i);
}
```
