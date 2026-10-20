import type { Token } from "../parser/token.js";

export class Break extends Error {
  constructor() {
    super();
    this.name = "Break";
  }
}

export class Continue extends Error {
  constructor() {
    super();
    this.name = "Continue";
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
