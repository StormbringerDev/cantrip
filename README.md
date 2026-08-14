# Cantrip

A lightweight, expressive scripting language.

Cantrip is designed as a fast-to-build, enjoyable scripting language with a clean syntax.  
It serves as a practical learning vehicle and a future scripting layer for the [Ritual](https://github.com/StormbringerDev/ritual) game engine.

### Implementation Roadmap

| Stage                                  | Status        | Description                            |
| -------------------------------------- | ------------- | -------------------------------------- |
| 1. TypeScript Tree-Walking Interpreter | 🏗️ Building   | Fast iteration on syntax & semantics   |
| 2. Rust Bytecode VM                    | 🚧 Scaffolded | Portable, efficient execution          |
| 3. Rust JIT                            | 🚧 Scaffolded | Native performance (Cranelift planned) |

---

## Monorepo Layout

```
cantrip/
├── apps/
│   ├── cantrip-cli/          # Rust CLI (REPL + runner) — the main `cantrip` binary
│   └── cantrip-repl-ts/      # Pure TypeScript REPL for rapid prototyping
├── crates/                   # Rust workspace
│   ├── cantrip-core/         # Shared AST, values, errors, opcodes
│   ├── cantrip-bytecode/     # Bytecode compiler + VM
│   ├── cantrip-jit/          # JIT backend (future)
│   └── cantrip-runtime/      # Embedding API + standard library
├── packages/                 # TypeScript (pnpm workspace)
│   ├── cantrip-ast/          # Shared AST types
│   ├── cantrip-parser/       # Recursive descent / Pratt parser
│   ├── cantrip-interpreter/  # Tree-walking interpreter (Stage 1)
│   └── cantrip-types/        # Shared TS utilities
├── examples/                 # .ctrp scripts (golden tests live here)
└── docs/
```

## Quick Start

### Prerequisites

- Node.js 20+ and pnpm 9+
- Rust 1.80+ (stable)
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

# Run the Rust CLI (not yet implemented)
cargo run -p cantrip-cli
```

### Example

```cantrip
// examples/hello.ctrp
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

GNU General Public License v3.0
