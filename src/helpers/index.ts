export * from "./constants";

import { Address, BigInt } from "@graphprotocol/graph-ts";

const zeroAddress = Address.zero().toHexString();

export function addressToId(address: Address, allowZero: bool = false): string {
  const id = address.toHexString();

  if (!allowZero && id == zeroAddress) {
    throw new Error("address id cannot be zero");
  }

  return id;
}

export function isZero(address: Address): boolean {
  const id = address.toHexString();
  return id == zeroAddress;
}

export function formatDateFromTimestamp(timestamp: BigInt): string {
  const ts = timestamp.toI64() * 1000; // convert to milliseconds
  const date = new Date(ts);

  const day = date.getUTCDate().toString().padStart(2, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const year = date.getUTCFullYear().toString();

  return `${day}-${month}-${year}`;
}
