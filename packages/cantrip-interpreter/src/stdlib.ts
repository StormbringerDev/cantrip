import { CantripNative } from "./callables.js";
import { Unit } from "./interpreter.js";

/** Prints a value to the terminal. */
export const print = new CantripNative((args) => {
  console.log(args[0]);
  return Unit;
}, 1);

/** Returns the current time since Unix epoch in miliseconds. */
export const time = new CantripNative((_args) => {
  return Date.now();
}, 0);
