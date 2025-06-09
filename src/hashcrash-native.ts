import { Address } from "@graphprotocol/graph-ts";
import { HashCrash } from "../generated/schema";
import { addressToId } from "./helpers";
import {
  HashCrash as HashCrashContract,
  RoundStarted as RoundStartedEvent,
  RoundAccelerated as RoundAcceleratedEvent,
  RoundEnded as RoundEndedEvent,
  BetPlaced as BetPlacedEvent,
  BetCashoutUpdated as BetCashoutUpdatedEvent,
  BetCancelled as BetCancelledEvent,
  ActiveUpdated as ActiveUpdatedEvent,
  LootTableUpdated as LootTableUpdatedEvent,
  LiquidityAdded as LiquidityAddedEvent,
  LiquidityRemoved as LiquidityRemovedEvent,
} from "./../generated/HashCrash/HashCrash";
import {
  handleRoundStarted as handleRoundStartedBase,
  handleRoundAccelerated as handleRoundAcceleratedBase,
  handleRoundEnded as handleRoundEndedBase,
  handleBetPlaced as handleBetPlacedBase,
  handleBetCashoutUpdated as handleBetCashoutUpdatedBase,
  handleBetCancelled as handleBetCancelledBase,
  handleLootTableUpdated as handleLootTableUpdatedBase,
  handleLiquidityAdded as handleLiquidityAddedBase,
  handleLiquidityRemoved as handleLiquidityRemovedBase,
} from "./hashcrash";
import { getOrCreateLiquidity, getOrCreateLootTable, getOrCreateToken } from "./objects";

export function handleRoundStarted(event: RoundStartedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);
  handleRoundStartedBase(hashcrash, event);
}

export function handleRoundAccelerated(event: RoundAcceleratedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);
  handleRoundAcceleratedBase(hashcrash, event);
}

export function handleRoundEnded(event: RoundEndedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);
  handleRoundEndedBase(hashcrash, event);
}

export function handleBetPlaced(event: BetPlacedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);
  handleBetPlacedBase(hashcrash, event);
}

export function handleBetCashoutUpdated(event: BetCashoutUpdatedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);
  handleBetCashoutUpdatedBase(hashcrash, event);
}

export function handleBetCancelled(event: BetCancelledEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);
  handleBetCancelledBase(hashcrash, event);
}

export function handleLootTableUpdated(event: LootTableUpdatedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);
  handleLootTableUpdatedBase(hashcrash, event);
}

export function handleLiquidityAdded(event: LiquidityAddedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);
  handleLiquidityAddedBase(hashcrash, event);
}

export function handleLiquidityRemoved(event: LiquidityRemovedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);
  handleLiquidityRemovedBase(hashcrash, event);
}

export function handleActiveUpdated(event: ActiveUpdatedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);
  hashcrash.active = event.params.active;
  hashcrash.save();
}

function getOrCreateHashCrash(address: Address): HashCrash {
  const id = addressToId(address);

  let hashcrash = HashCrash.load(id);
  if (hashcrash == null) {
    const contract = HashCrashContract.bind(address);

    hashcrash = new HashCrash(id);
    hashcrash.token = getOrCreateToken(Address.zero()).id;
    hashcrash.lootTable = getOrCreateLootTable(contract.getLootTable()).id;
    hashcrash.liquidity = getOrCreateLiquidity(hashcrash).id;
    hashcrash.active = false;
    hashcrash.save();
  }

  return hashcrash as HashCrash;
}
