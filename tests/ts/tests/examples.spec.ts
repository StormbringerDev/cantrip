import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { Parser, Scanner } from "@cantrip/parser";
import { Interpreter } from "@cantrip/interpreter";
import { exampleFiles } from "../src/index.js";

describe("examples", () => {
  const examples = exampleFiles();

  describe("hello.cantrip", () => {
    it("prints 'Hello, world!' to terminal", () => {
      const consoleMock = vi.spyOn(console, "log");
      const interpreter = new Interpreter();
      const file = examples.find((ex) => ex.includes("hello.cantrip"))!;
      const source = readFileSync(file, "utf8");
      const scanner = new Scanner(source);
      const { tokens, scannerErrors } = scanner.scanTokens();
      expect(scannerErrors).toHaveLength(0);
      const parser = new Parser(tokens);
      const { ast, parseErrors } = parser.parse();
      expect(parseErrors).toHaveLength(0);
      interpreter.interpret(ast.filter((s) => s !== null));
      expect(consoleMock).toHaveBeenCalledTimes(2);
      expect(consoleMock).toHaveBeenCalledWith("Hello, Cantrip!");
      expect(consoleMock).toHaveBeenCalledWith("Hello, world!");
    });
  });

  describe("control.cantrip", () => {
    it("executes control flow correctly", () => {
      const consoleMock = vi.spyOn(console, "log");
      const interpreter = new Interpreter();
      const file = examples.find((ex) => ex.includes("control.cantrip"))!;
      const source = readFileSync(file, "utf8");
      const scanner = new Scanner(source);
      const { tokens, scannerErrors } = scanner.scanTokens();
      expect(scannerErrors).toHaveLength(0);
      const parser = new Parser(tokens);
      const { ast, parseErrors } = parser.parse();
      expect(parseErrors).toHaveLength(0);
      interpreter.interpret(ast.filter((s) => s !== null));
      expect(consoleMock).toHaveBeenCalledTimes(9);
      expect(consoleMock).toHaveBeenCalledWith("=== Control Flow ===");
      expect(consoleMock).toHaveBeenCalledWith("n = 0");
      expect(consoleMock).toHaveBeenCalledWith("n = 1");
      expect(consoleMock).toHaveBeenCalledWith("n = 2");
      expect(consoleMock).toHaveBeenCalledWith("n = 3");
      expect(consoleMock).toHaveBeenCalledWith("n = 4");
      expect(consoleMock).toHaveBeenCalledWith("Loop finished correctly");
      expect(consoleMock).toHaveBeenCalledWith("max(10, 7) = 10");
      expect(consoleMock).toHaveBeenCalledWith("max(3, 9)  = 9");
    });
  });

  describe("math.cantrip", () => {
    it("executes arithmetic expressions", () => {
      const consoleMock = vi.spyOn(console, "log");
      const interpreter = new Interpreter();
      const file = examples.find((ex) => ex.includes("math.cantrip"))!;
      const source = readFileSync(file, "utf8");
      const scanner = new Scanner(source);
      const { tokens, scannerErrors } = scanner.scanTokens();
      expect(scannerErrors).toHaveLength(0);
      const parser = new Parser(tokens);
      const { ast, parseErrors } = parser.parse();
      expect(parseErrors).toHaveLength(0);
      interpreter.interpret(ast.filter((s) => s !== null));
      expect(consoleMock).toHaveBeenCalledTimes(6);
      expect(consoleMock).toHaveBeenCalledWith("=== Cantrip Math Demo ===");
      expect(consoleMock).toHaveBeenCalledWith("a + b = 42");
      expect(consoleMock).toHaveBeenCalledWith("a * b = 80");
      expect(consoleMock).toHaveBeenCalledWith("a / b = 20");
      expect(consoleMock).toHaveBeenCalledWith("add(40, 2) = 42");
      expect(consoleMock).toHaveBeenCalledWith("factorial(6) = 720");
    });
  });
});
