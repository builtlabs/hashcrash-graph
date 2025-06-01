import { addressToId } from "../helpers";
import { Address } from "@graphprotocol/graph-ts";
import { PlatformInterface } from "../../generated/schema";

export function getPlatformInterface(id: string): PlatformInterface {
  const platformInterface = PlatformInterface.load(id);

  if (platformInterface == null) {
    throw new Error("PlatformInterface not found: " + id);
  }

  return platformInterface as PlatformInterface;
}

export function getOrCreatePlatformInterface(address: Address): PlatformInterface {
  let id = addressToId(address);

  let platform = PlatformInterface.load(id);
  if (platform == null) {
    platform = new PlatformInterface(id);
    platform.rewardRates = [];
    platform.save();
  }

  return platform as PlatformInterface;
}
