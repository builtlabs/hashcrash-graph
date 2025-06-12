import { BigInt } from "@graphprotocol/graph-ts";
import { HashCrash } from "../generated/schema";
import {
  RoundStarted as RoundStartedEvent,
  RoundAccelerated as RoundAcceleratedEvent,
  RoundEnded as RoundEndedEvent,
  RoundRefunded as RoundRefundedEvent,
  BetPlaced as BetPlacedEvent,
  BetCashoutUpdated as BetCashoutUpdatedEvent,
  BetCancelled as BetCancelledEvent,
  LootTableUpdated as LootTableUpdatedEvent,
  LiquidityAdded as LiquidityAddedEvent,
  LiquidityRemoved as LiquidityRemovedEvent,
} from "./../generated/HashCrash/HashCrash";
import {
  accrueVolumePoints,
  getBet,
  getLootTable,
  getOrCreateBet,
  getOrCreateLootTable,
  getOrCreatePlayer,
  getOrCreateRound,
  getOrCreateWallet,
  getPlayer,
  Liquidity,
  LiquidityProvider,
  Points,
} from "./objects";
import { HashCrashStats } from "./stats/hashcrash-stats";
import { PlayerStats } from "./stats/player-stats";

export function handleRoundStarted(hashcrash: HashCrash, event: RoundStartedEvent): void {
  const round = getOrCreateRound(hashcrash, event.params.roundHash);
  round.hashIndex = event.params.hashIndex;
  round.startBlock = event.params.startBlock;
  round.save();
}

export function handleRoundAccelerated(hashcrash: HashCrash, event: RoundAcceleratedEvent): void {
  const round = getOrCreateRound(hashcrash, event.params.roundHash);
  round.startBlock = event.params.startBlock;
  round.save();
};

export function handleRoundEnded(hashcrash: HashCrash, event: RoundEndedEvent): void {
  const round = getOrCreateRound(hashcrash, event.params.roundHash);
  round.salt = event.params.roundSalt;
  round.deadIndex = event.params.deadIndex;
  round.save();

  const hashcrashStats = new HashCrashStats(hashcrash, event.block.timestamp);
  hashcrashStats.registerRound();

  const bets = round.bets.load();
  for (let i = 0; i < bets.length; i++) {
    if (!bets[i].cancelled) {
      hashcrashStats.registerUserId(bets[i].player);
      hashcrashStats.registerBet(bets[i].amount);

      const player = getPlayer(bets[i].player);
      const playerStats = new PlayerStats(hashcrash, player, event.block.timestamp);
      playerStats.handleBetPlaced(round.id, bets[i].amount, bets[i].multiplier);

      accrueVolumePoints(hashcrash, player, bets[i].amount, event.block.timestamp);

      // On Win
      if (bets[i].cashoutIndex.lt(event.params.deadIndex)) {
        const multiplied = bets[i].amount.times(bets[i].multiplier);
        const won = multiplied.div(BigInt.fromI32(1000000));

        hashcrashStats.registerWin(won);
        playerStats.handleBetWon(won, won.minus(bets[i].amount), bets[i].multiplier);
      }

      playerStats.save();
    }
  }

  hashcrashStats.save();
}

export function handleRoundRefunded(hashcrash: HashCrash, event: RoundRefundedEvent): void {
  const round = getOrCreateRound(hashcrash, event.params.roundHash);
  round.salt = event.params.roundSalt;
  round.save();
}

export function handleBetPlaced(hashcrash: HashCrash, event: BetPlacedEvent): void {
  const lootTable = getLootTable(hashcrash.lootTable);

  const round = getOrCreateRound(hashcrash, event.params.roundHash);
  const player = getOrCreatePlayer(hashcrash, event.params.user);

  const bet = getOrCreateBet(round, player, event.params.index);
  bet.amount = event.params.amount;
  bet.multiplier = lootTable.multipliers[event.params.cashoutIndex.toI32()];
  bet.cashoutIndex = event.params.cashoutIndex;
  bet.save();
}

export function handleBetCashoutUpdated(hashcrash: HashCrash, event: BetCashoutUpdatedEvent): void {
  const round = getOrCreateRound(hashcrash, event.params.roundHash);
  const lootTable = getLootTable(hashcrash.lootTable);

  const bet = getBet(round, event.params.index);
  bet.multiplier = lootTable.multipliers[event.params.cashoutIndex.toI32()];
  bet.cashoutIndex = event.params.cashoutIndex;
  bet.save();
}

export function handleBetCancelled(hashcrash: HashCrash, event: BetCancelledEvent): void {
  const round = getOrCreateRound(hashcrash, event.params.roundHash);

  const bet = getBet(round, event.params.index);
  bet.cancelled = true;
  bet.save();
}

export function handleLootTableUpdated(hashcrash: HashCrash, event: LootTableUpdatedEvent): void {
  const lootTable = getOrCreateLootTable(event.params.lootTable);

  hashcrash.lootTable = lootTable.id;
  hashcrash.save();
}

export function handleLiquidityAdded(hashcrash: HashCrash, event: LiquidityAddedEvent): void {
  const hashCrashStats = new HashCrashStats(hashcrash, event.block.timestamp);
  hashCrashStats.registerUserAddress(event.params.user);
  hashCrashStats.save();

  const liquidity = new Liquidity(hashcrash, event.block.timestamp);
  liquidity.handleDeposit(event.params.shareDelta, event.params.tokenDelta);
  liquidity.save();

  const liquidityProvider = new LiquidityProvider(hashcrash, liquidity.id, event.params.user, event.block.timestamp);
  liquidityProvider.handleDeposit(event.params.shareDelta, event.params.tokenDelta);
  liquidityProvider.save();

  const userPoints = new Points(hashcrash, getOrCreateWallet(event.params.user), event.block.timestamp);
  userPoints.accrueLiquidityPoints(liquidityProvider, event.block.number, event.block.timestamp);
  userPoints.save();
}

export function handleLiquidityRemoved(hashcrash: HashCrash, event: LiquidityRemovedEvent): void {
  const hashCrashStats = new HashCrashStats(hashcrash, event.block.timestamp);
  hashCrashStats.registerUserAddress(event.params.user);
  hashCrashStats.save();

  const liquidity = new Liquidity(hashcrash, event.block.timestamp);
  liquidity.handleWithdrawal(event.params.shareDelta, event.params.tokenDelta);
  liquidity.save();

  const liquidityProvider = new LiquidityProvider(hashcrash, liquidity.id, event.params.user, event.block.timestamp);
  liquidityProvider.handleWithdrawal(event.params.shareDelta, event.params.tokenDelta);
  liquidityProvider.save();

  const userPoints = new Points(hashcrash, getOrCreateWallet(event.params.user), event.block.timestamp);
  userPoints.accrueLiquidityPoints(liquidityProvider, event.block.number, event.block.timestamp);
  userPoints.save();
}
