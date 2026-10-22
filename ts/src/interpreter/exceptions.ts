import type { Token } from "../parser/token.js";
import { Value } from "./runtime-types.js";

export class BreakException extends Error {
  constructor() {
    super();
    this.name = "BreakException";
  }
}

export class ContinueException extends Error {
  constructor() {
    super();
    this.name = "ContinueException";
  }
}

export class ReturnException extends Error {
  readonly value: Value;

  constructor(value: Value) {
    super();
    this.name = "ReturnException";
    this.value = value;
  }
}

export class RuntimeError extends Error {
  readonly token: Token;

  constructor(token: Token, message: string) {
    super(message);
    this.name = "RuntimeError";
    this.token = token;
  }
}
