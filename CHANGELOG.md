# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Variable resolution pass

## [0.1.0] - 2026-08-23

### Added

- TypeScript tree-walking interpreter (feature-complete for the current dynamic subset)
- Lexer/scanner with full token support (including keywords: `break`, `continue`, `match`, etc.)
- Recursive-descent / Pratt parser covering:
  - Literals, unary/binary/logical expressions, grouping
  - Variables, assignment, compound assignment
  - Blocks, `if` expressions, `while` / infinite loops, `break`/`continue` (value-carrying break)
  - `match` expressions
  - Function declarations & calls, `return` statements, unit type
  - Array and object literals, indexing, get/set
  - String escape sequences
- Environment / lexical scoping
- Expression & statement evaluation
- Standard library functions
- Diagnostic / error reporting system (refactored into its own package, wired through the interpreter)
- TypeScript REPL (`cantrip-repl-ts`)
- Rust CLI scaffold (`cantrip-cli`)
- VS Code extension
- End-toend tests (TS interpreter) + additional test coverage
- Language documentation: `lexer.md`, `grammar.md`, `semantics.md`
- Example scripts under `examples/`

### Changed

- Project renamed from Quill -> Cantrip
- License set to LGPL-3.0
- Assign parsing now uses a phantom operator; compound assignment sugarized
- Old error accumulation replaced with new diagnostic system

### Fixed

- Block parsing
- Native function test case
- Grammar notation / EBNF accuracy
- pnpm version conflict in GitHub Actions
- Various typos and lockfile / dependency issues

### Notes

- Stage 1 (TS tree-walking interpreter) is marked feature-complete.
- Stages 2 (Rust bytecode VM) and 3 (Cranelift JIT) remain scaffolded.
