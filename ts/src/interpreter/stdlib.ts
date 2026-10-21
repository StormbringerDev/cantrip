import { type CantripFunction, stringify, UNIT } from "./runtime-types.js";

export const printNative: CantripFunction = {
  arity: 1,
  call: (args) => {
    console.log(stringify(args[0]));
    return UNIT;
  },
  toString: () => "<native fn>",
};

export const timeNative: CantripFunction = {
  arity: 0,
  call: (_args) => Date.now(),
  toString: () => "<native fn>",
};
