# Cantrip Language Documentation

Cantrip is a lightweight scripting language with a simple, predictable surface syntax.  
It is designed to be easy to embed and easy to reason about.

## Design Goals

- Minimal, orthogonal feature set
- Clear and predictable evaluation model
- Progressive implementation path (interpreter -> bytecode -> JIT)
- No macros or complex metaprogramming

## Current Status

| Component                | Status   | Notes                        |
| ------------------------ | -------- | ---------------------------- |
| Lexer / Scanner          | Complete | See [lexer.md](lexer.md)     |
| Parser                   | Building | See [grammar.md](grammar.md) |
| Tree-walking interpreter | Planned  | First execution target       |
| Bytecode VM              | Planned  |                              |
| Cranelift JIT            | Planned  |                              |

## Documentation Layout

- [`lexer.md`](lexer.md) - complete token definitions and scanning rules (source of truth for the current implementation)
- [`grammar.md`](grammar.md) - surface syntax
- `semantics.md` - (coming soon) evaluation rules once the interpreter exists

The lexer documentation is intentionally the most detailed right now that is the only (mostly) finished component. All other sections will be filled in as the corresponding implementation lands.
