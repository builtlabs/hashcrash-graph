import { BigInt } from "@graphprotocol/graph-ts";

export namespace PERIOD {
  export const LIFETIME = "LIFETIME";
  export const SEASON = "SEASON";
  export const DAY = "DAY";
}

export namespace VALUES {
  export const ZERO = BigInt.fromI32(0);
  export const ONE = BigInt.fromI32(1);
}