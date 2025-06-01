import { addressToId } from "../helpers";
import { Address } from "@graphprotocol/graph-ts";
import { LootTable } from "../../generated/schema";
import { LootTable as LootTableContract } from "../../generated/HashCrashERC20/LootTable";

export function getLootTable(id: string): LootTable {
  const lootTable = LootTable.load(id);

  if (lootTable == null) {
    throw new Error("LootTable not found: " + id);
  }

  return lootTable as LootTable;
}

export function getOrCreateLootTable(address: Address): LootTable {
  const id = addressToId(address);

  let lootTable = LootTable.load(id);
  if (lootTable == null) {
    const contract = LootTableContract.bind(address);

    lootTable = new LootTable(id);
    lootTable.length = contract.getLength();
    lootTable.multipliers = contract.getMultipliers();
    lootTable.probabilities = contract.getProbabilities();
    lootTable.save();
  }

  return lootTable as LootTable;
}
