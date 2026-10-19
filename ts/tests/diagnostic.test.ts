import { describe, expect, it } from "vitest";

import { DiagnosticCollector } from "../src/diagnostic/collector.js";
import { error, hint, info, warning } from "../src/diagnostic/create.js";
import { TokenType } from "../src/parser/token.js";
import type { Span } from "../src/types/location.js";

import { tok } from "./test-helpers.js";

const span: Span = {
  start: { line: 2, column: 1, offset: 4 },
  end: { line: 2, column: 5, offset: 8 },
};

describe("diagnostic helpers", () => {
  it("builds an error from a span", () => {
    expect(error("unexpected character", span)).toEqual({
      severity: "error",
      message: "unexpected character",
      span,
    });
  });

  it("builds a warning from a token", () => {
    const token = tok(TokenType.Plus, "+", null, 2, 3);

    expect(
      warning("redundant operator", token, {
        code: "W001",
        notes: [{ message: "remove it", span: token.span }],
      }),
    ).toEqual({
      severity: "warning",
      message: "redundant operator",
      span: token.span,
      code: "W001",
      notes: [{ message: "remove it", span: token.span }],
    });
  });

  it("builds info and hint diagnostics", () => {
    expect(info("parsed expression", span).severity).toBe("info");
    expect(hint("try parentheses", span).severity).toBe("hint");
  });
});

describe("DiagnosticCollector", () => {
  it("records a prebuilt diagnostic", () => {
    const diagnostics = new DiagnosticCollector();
    const diag = error("expect expression", span);

    diagnostics.emit(diag);

    expect(diagnostics.getDiagnostics()).toEqual([diag]);
    expect(diagnostics.hasError()).toBe(true);
  });

  it("does not treat warnings as errors", () => {
    const diagnostics = new DiagnosticCollector();

    diagnostics.emit(warning("unused value", span));

    expect(diagnostics.hasError()).toBe(false);
  });

  it("clears recorded diagnostics", () => {
    const diagnostics = new DiagnosticCollector();
    diagnostics.emit(error("expect expression", span));

    diagnostics.clear();

    expect(diagnostics.getDiagnostics()).toEqual([]);
    expect(diagnostics.hasError()).toBe(false);
  });
});
