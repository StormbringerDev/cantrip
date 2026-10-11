# Cantrip

Cantrip is a scripting language designed to be embeddable, easy to write, and easy to reason about. This project is the planned scripting layer for the [Ritual](https://github.com/StormbringerDev/ritual) game engine.

## Getting Started

### Prerequisites

#### Python

- Python version 3.11 or higher
- uv version 0.12.19 up to and excluding version 0.13.0

#### C

- A C compiler (GCC, Clang, MSVC, etc.) that supports C11
- CMake version 3.16 or higher
- Ninja

#### Optional

- Just for convenience commands (read `justfile` for the commands)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/StormbringerDev/cantrip
cd cantrip

# 2. Build the interpreter (C only)
# with just
just build-c
# without just
cmake --preset dev
cmake --build --preset dev
```

### Usage

For the Python tree-walker:

```bash
# with just
just run-python [script]
# without just
cd python # from repo root
uv run cantrip [script]
```

For the bytecode interpreter:

```bash
# with just
just run-c [script]
# without just
./c/build/dev/cantrip [script]
```

### Example Program

```rust
let name = "world";
print("Hello, " + name + "!");

fn add(a, b) {
  a + b
}

print(add(40, 2));
```

## Roadmap

### Language Features

- `loop` expressions — Infinite loops that can return a value with `break`. `break` statements in a `while` loop will not be able to carry a value.
- `const` declarations — Syntax for declaring immutable variables: `const name = value`. `const` declarations must be initialized before use.
- Arrow functions — Alternative syntax for creating anonymous functions: `(params) => expr` (equivalent to `fn(params) { ... }`).
- Arrays and JS-like objects — Structured data to make handling JSON and other structured data easier.
- Gradual typing with inferrence — A type-checking model similar to TypeScript.

### Language support

- LSP — A language server protocol that writes to stdout.
- Editor support — Syntax highlighting and LSP integration. Currently, only VS Code and Neovim support is planned.
- Formatter, linter — Additional support for Cantrip development.

## License

GNU Lesser General Public License v3.0.
