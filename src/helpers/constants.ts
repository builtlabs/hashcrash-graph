import { Address, BigInt } from "@graphprotocol/graph-ts";

export namespace PERIOD {
  export const LIFETIME = "LIFETIME";
  export const SEASON = "SEASON";
  export const DAY = "DAY";
  export const FIFTEEN_MINUTES = "FIFTEEN_MINUTES";
}

export namespace VALUES {
  export const ZERO_ADDRESS = Address.zero();
  export const ZERO = BigInt.fromI32(0);
  export const ONE = BigInt.fromI32(1);
  export const TWO = BigInt.fromI32(2);
  export const DENOMINATOR = BigInt.fromI32(10000);
  export const MULTIPLIER_DENOMINATOR = BigInt.fromI32(1000000);
  export const WEI = BigInt.fromI32(10).pow(18 as u8);
}