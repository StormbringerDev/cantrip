import { describe, expect, it } from "vitest";

import { DiagnosticCollector } from "../src/diagnostic/collector.js";
import { error, hint, info, warning } from "../src/diagnostic/create.js";
import {
  formatDiagnostic,
  formatDiagnostics,
} from "../src/diagnostic/format.js";
import { TokenType } from "../src/parser/token.js";
import type { Diagnostic } from "../src/types/diagnostic.js";
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

describe("formatDiagnostic", () => {
  it("points at one character and prints a code", () => {
    const source = "let x = @";
    const formatted = formatDiagnostic(
      error(
        "unexpected character",
        {
          start: { line: 1, column: 1, offset: 8 },
          end: { line: 1, column: 1, offset: 9 },
        },
        { code: "E001" },
      ),
      { name: "hello.cantrip", text: source },
    );

    expect(formatted).toBe(
      [
        "error[E001]: unexpected character",
        " --> hello.cantrip:1:9",
        "  |",
        "1 | let x = @",
        "  |         ^",
      ].join("\n"),
    );
  });

  it("underlines a multi-character span", () => {
    const formatted = formatDiagnostic(
      error("bad token", {
        start: { line: 1, column: 5, offset: 4 },
        end: { line: 1, column: 9, offset: 8 },
      }),
      { text: "let name" },
    );

    expect(formatted).toBe(
      [
        "error: bad token",
        " --> 1:5",
        "  |",
        "1 | let name",
        "  |     ^^^^",
      ].join("\n"),
    );
  });

  it("points a zero-width span at the offset", () => {
    const source = "let x";
    const formatted = formatDiagnostic(
      error("unexpected end", {
        start: { line: 9, column: 9, offset: source.length },
        end: { line: 9, column: 9, offset: source.length },
      }),
      { name: "file", text: source },
    );

    expect(formatted).toBe(
      [
        "error: unexpected end",
        " --> file:1:6",
        "  |",
        "1 | let x",
        "  |      ^",
      ].join("\n"),
    );
  });

  it("shows every line of a three-line span", () => {
    const source = "a\nb\nc";
    const formatted = formatDiagnostic(
      error("unclosed block", {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 3, column: 2, offset: source.length },
      }),
      { name: "file", text: source },
    );

    expect(formatted).toBe(
      [
        "error: unclosed block",
        " --> file:1:1",
        "  |",
        "1 | a",
        "  | ^",
        "2 | b",
        "  | ^",
        "3 | c",
        "  | ^",
      ].join("\n"),
    );
  });

  it("elides the middle of a span longer than three lines", () => {
    const source = [
      "abcd",
      "efgh",
      "ijkl",
      "mnop",
      "qrst",
      "uvwx",
      "yzab",
      "cdef",
      "ghij",
      "mnop",
    ].join("\n");
    const formatted = formatDiagnostic(
      error("unclosed block", {
        start: { line: 1, column: 1, offset: source.indexOf("b") },
        end: { line: 1, column: 1, offset: source.lastIndexOf("o") + 1 },
      }),
      { name: "file", text: source },
    );

    expect(formatted).toBe(
      [
        "error: unclosed block",
        "  --> file:1:2",
        "   |",
        " 1 | abcd",
        "   |  ^^^",
        "...",
        "10 | mnop",
        "   | ^^^",
      ].join("\n"),
    );
  });

  it("prints a spanless note under the snippet", () => {
    const formatted = formatDiagnostic(
      error(
        "unexpected character",
        {
          start: { line: 1, column: 9, offset: 8 },
          end: { line: 1, column: 10, offset: 9 },
        },
        { notes: [{ message: "remove it" }] },
      ),
      { name: "hello.cantrip", text: "let x = @" },
    );

    expect(formatted).toBe(
      [
        "error: unexpected character",
        " --> hello.cantrip:1:9",
        "  |",
        "1 | let x = @",
        "  |         ^",
        "  = note: remove it",
      ].join("\n"),
    );
  });

  it("gives a spanned note its own snippet", () => {
    const source = "foo\nbar";
    const formatted = formatDiagnostic(
      error(
        "problem",
        {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 4, offset: 3 },
        },
        {
          notes: [
            {
              message: "both lines",
              span: {
                start: { line: 1, column: 1, offset: 0 },
                end: { line: 2, column: 4, offset: source.length },
              },
            },
          ],
        },
      ),
      { name: "file", text: source },
    );

    expect(formatted).toBe(
      [
        "error: problem",
        " --> file:1:1",
        "  |",
        "1 | foo",
        "  | ^^^",
        "  |",
        "1 | foo",
        "  | ^^^",
        "2 | bar",
        "  | ^^^ both lines",
      ].join("\n"),
    );
  });

  it("prints a diagnostic that has no span", () => {
    const diagnostic: Diagnostic = {
      severity: "warning",
      message: "nothing to point at",
    };

    expect(formatDiagnostic(diagnostic, { text: "let x = 1" })).toBe(
      "warning: nothing to point at",
    );
  });

  it("prints the header and location when the offset is past the source", () => {
    const formatted = formatDiagnostic(
      error("broken", {
        start: { line: 2, column: 3, offset: 50 },
        end: { line: 2, column: 4, offset: 51 },
      }),
      { name: "file", text: "hi" },
    );

    expect(formatted).toBe(["error: broken", " --> file:2:3"].join("\n"));
  });

  it("aligns a caret with an expanded tab", () => {
    const formatted = formatDiagnostic(
      error("unexpected character", {
        start: { line: 1, column: 1, offset: 1 },
        end: { line: 1, column: 1, offset: 2 },
      }),
      { name: "file", text: "\t@" },
    );

    expect(formatted).toBe(
      [
        "error: unexpected character",
        " --> file:1:5",
        "  |",
        "1 |     @",
        "  |     ^",
      ].join("\n"),
    );
  });
});

describe("formatDiagnostics", () => {
  it("separates diagnostics with a blank line", () => {
    const source = "ab";
    const formatted = formatDiagnostics(
      [
        error("first", {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 2, offset: 1 },
        }),
        warning("second", {
          start: { line: 1, column: 2, offset: 1 },
          end: { line: 1, column: 3, offset: 2 },
        }),
      ],
      { name: "file", text: source },
    );

    expect(formatted).toBe(
      [
        "error: first",
        " --> file:1:1",
        "  |",
        "1 | ab",
        "  | ^",
        "",
        "warning: second",
        " --> file:1:2",
        "  |",
        "1 | ab",
        "  |  ^",
      ].join("\n"),
    );
  });
});
