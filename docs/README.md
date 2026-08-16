# Cantrip Language Documentation

Cantrip is a lightweight scripting language with a simple, predictable surface syntax.  
It is designed to be easy to embed and easy to reason about.

## Design Goals

- Minimal, orthogonal feature set
- Clear and predictable evaluation model
- Progressive implementation path (interpreter -> bytecode -> JIT)
- No macros or complex metaprogramming

## Current Status

| Component                | Status                              | Notes                            |
| ------------------------ | ----------------------------------- | -------------------------------- |
| Lexer / Scanner          | Complete                            | See [lexer.md](lexer.md)         |
| Parser                   | Complete (for current surface)      | See [grammar.md](grammar.md)     |
| Tree-walking interpreter | Feature-complete for dynamic subset | See [semantics.md](semantics.md) |
| Bytecode VM              | Planned                             |                                  |
| Cranelift JIT            | Planned                             |                                  |

## Documentation Layout

- [`lexer.md`](lexer.md) - complete token definitions and scanning rules (source of truth for the current implementation)
- [`grammar.md`](grammar.md) - surface syntax
- [`semantics.md`](semantics.md) - evaluation rules
