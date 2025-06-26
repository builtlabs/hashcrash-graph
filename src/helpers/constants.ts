import { Address, BigInt } from "@graphprotocol/graph-ts";

export namespace PERIOD {
  export const LIFETIME = "LIFETIME";
  export const SEASON = "SEASON";
  export const DAY = "DAY";
}

export namespace VALUES {
  export const ZERO_ADDRESS = Address.zero();
  export const ZERO = BigInt.fromI32(0);
  export const ONE = BigInt.fromI32(1);
  export const DENOMINATOR = BigInt.fromI32(10000);
}