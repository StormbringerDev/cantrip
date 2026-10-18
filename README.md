# Cantrip

Cantrip is a scripting language designed to be embeddable, easy to write, and easy to reason about. This project is the planned scripting layer for the [Ritual](https://github.com/StormbringerDev/ritual) game engine.

## Getting Started

### Prerequisites

#### TypeScript

- NodeJS version 22 or higher
- pnpm version 10 or higher

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

# 2. Build the interpreter

# with just
just build-ts # Tree-walker
just build-c  # Bytecode

# without just

# Tree-walker
cd ts
pnpm install
pnpm build

# Bytecode
cmake --preset dev
cmake --build --preset dev
```

### Usage

For the TypeScript tree-walker:

```bash
# with just
just run-ts [script]

# without just
cd ts # from repo root
pnpm run cli [script]
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
