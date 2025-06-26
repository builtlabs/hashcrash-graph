import { Address } from "@graphprotocol/graph-ts";
import { HashCrash } from "../../generated/schema";
import { addressToId, VALUES } from "../helpers";
import { HashCrash as HashCrashContract } from "../../generated/HashCrashGrind/HashCrash";
import { getOrCreateToken } from "./common";
import { getOrCreateLootTable } from "./loot-table";
import { getOrCreateLiquidity } from "./liquidity";

export function getHashcrash(id: string): HashCrash {
  const hashcrash = HashCrash.load(id);

  if (hashcrash == null) {
    throw new Error("HashCrash not found: " + id);
  }

  return hashcrash as HashCrash;
}

export function getOrCreateHashCrash(address: Address): HashCrash {
  const id = addressToId(address);

  let hashcrash = HashCrash.load(id);
  if (hashcrash == null) {
    const contract = HashCrashContract.bind(address);

    hashcrash = new HashCrash(id);
    hashcrash.token = getOrCreateToken(contract.token()).id;
    hashcrash.lootTable = getOrCreateLootTable(contract.getLootTable()).id;
    hashcrash.liquidity = getOrCreateLiquidity(hashcrash).id;
    hashcrash.active = false;
    hashcrash.hashProducer = VALUES.ZERO_ADDRESS;
    hashcrash.introBlocks = VALUES.ZERO;
    hashcrash.reducedIntroBlocks = VALUES.ZERO;
    hashcrash.cancelReturnNumerator = VALUES.ZERO;
    hashcrash.save();
  }

  return hashcrash as HashCrash;
}
