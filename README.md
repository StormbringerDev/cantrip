# Cantrip

A lightweight, expressive scripting language.

Cantrip is designed as a fast-to-build, enjoyable scripting language with a clean syntax.  
It serves as a practical learning vehicle and a scripting layer for the [Ritual](https://github.com/StormbringerDev/ritual) game engine.

### Implementation Roadmap

| Stage                                  | Status              | Description                          |
| -------------------------------------- | ------------------- | ------------------------------------ |
| 1. TypeScript Tree-Walking Interpreter | ✅ Feature-complete | Fast iteration on syntax & semantics |
| 2. C Bytecode VM                       | 🚧 Scaffolded       | Portable, efficient execution        |
| 3. C JIT                               | 🚧 Scaffolded       | Native performance (LLVM planned)    |

---

## Monorepo Layout

```
cantrip/
├── apps/
│   ├── cantrip-cli/          # Rust CLI (REPL + runner) — the deprecated `cantrip` binary
│   ├── cantrip/              # C CLI (REPL + runner) — the main `cantrip` binary
│   └── cantrip-repl-ts/      # Pure TypeScript REPL for rapid prototyping
├── include/cantrip/          # Public C interface
├── src/                      # C workspace
│   ├── core/                 # Shared AST, values, memory management
│   ├── compiler/             # Bytecode compiler
│   ├── vm/                   # Bytecode VM
│   ├── runtime/              # Embedding implementation + standard library
│   └── jit/                  # JIT backend (future)
├── packages/                 # TypeScript (pnpm workspace)
│   ├── cantrip-ast/          # Shared AST types
│   ├── cantrip-parser/       # Recursive descent / Pratt parser
│   ├── cantrip-interpreter/  # Tree-walking interpreter (Stage 1)
│   └── cantrip-types/        # Shared TS utilities
├── examples/                 # .cantrip scripts (golden tests live here)
├── tests/
│   ├── e2e/                  # End to end tests for the tree-walking interpreter
│   └── e2e-rs/               # End to end tests for the bytecode and JIT interpreters
└── docs/
```

## Quick Start

### Prerequisites

- Node.js 20+ and pnpm 9+
- A C compiler (`gcc`, `clang`, etc.)
- CMake 3.21+
- (Optional) just / make for convenience scripts

```bash
# Clone & enter
git clone https://github.com/StormbringerDev/cantrip.git
cd cantrip

# Install JS dependencies
pnpm install

# Build everything
pnpm build

# Run the TypeScript REPL
pnpm --filter cantrip-repl-ts dev

# Build & run the C CLI (not yet implemented)
cmake --preset dev && cmake --build build/dev
./build/dev/apps/cantrip/cantrip
```

### Example

```cantrip
// examples/hello.cantrip
let name = "world";
print("Hello, " + name + "!");

fn add(a, b) {
  a + b
}

print(add(40, 2));
```

## Development

```bash
# Run all tests
pnpm test

# Type-check + lint
pnpm check

# Watch mode for TS packages
pnpm dev
```

## Design Goals

- **Lightweight** - small core, easy to embed
- **Expressive** - clean syntax inspired by modern scripting languages
- **Fast iteration** - TypeScript prototype first
- **Performance path** - clear route to bytecode + JIT
- **No macros (for now)** - keep the language simple and the implementation focused

## License

GNU Lesser General Public License v3.0
