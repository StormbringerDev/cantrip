import type { Token } from "../parser/token.js";

export type Value = number | string | boolean | null;

export class RuntimeError extends Error {
  readonly token: Token;

  constructor(token: Token, message: string) {
    super(message);
    this.name = "RuntimeError";
    this.token = token;
  }
}
