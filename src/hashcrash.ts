import { BigInt } from "@graphprotocol/graph-ts";
import {
  RoundStarted as RoundStartedEvent,
  RoundAccelerated as RoundAcceleratedEvent,
  RoundEnded as RoundEndedEvent,
  RoundRefunded as RoundRefundedEvent,
  BetPlaced as BetPlacedEvent,
  BetCashoutUpdated as BetCashoutUpdatedEvent,
  BetCancelled as BetCancelledEvent,
  ActiveUpdated as ActiveUpdatedEvent,
  LootTableUpdated as LootTableUpdatedEvent,
  LiquidityAdded as LiquidityAddedEvent,
  LiquidityRemoved as LiquidityRemovedEvent,
} from "./../generated/HashCrashGrind/HashCrash";
import {
  accrueVolumePoints,
  getBet,
  getLootTable,
  getLootTableContract,
  getOrCreateBet,
  getOrCreateHashCrash,
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
import { VALUES } from "./helpers";

export function handleRoundStarted(event: RoundStartedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);

  const round = getOrCreateRound(hashcrash, event.params.roundHash);
  round.hashIndex = event.params.hashIndex;
  round.startBlock = event.params.startBlock;
  round.initialLiquidity = event.params.liquidity;
  round.save();
}

export function handleRoundAccelerated(event: RoundAcceleratedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);

  const round = getOrCreateRound(hashcrash, event.params.roundHash);
  round.startBlock = event.params.startBlock;
  round.save();
}

export function handleRoundEnded(event: RoundEndedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);

  const lootTable = getLootTable(hashcrash.lootTable);
  const lootTableContract = getLootTableContract(lootTable);

  const round = getOrCreateRound(hashcrash, event.params.roundHash);
  round.salt = event.params.roundSalt;
  round.deadIndex = event.params.deadIndex;
  round.proof = event.params.proof;
  round.hashes = lootTableContract.getRoundBlockHashes(
    event.params.proof,
    event.params.deadIndex,
    round.startBlock,
  )

  if (event.params.deadIndex == VALUES.ZERO) {
    round.multiplier = VALUES.ZERO;
  } else {
    round.multiplier = lootTable.multipliers[event.params.deadIndex.toI32() - 1];
  }

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

export function handleRoundRefunded(event: RoundRefundedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);
  hashcrash.active = false;
  hashcrash.save();

  const round = getOrCreateRound(hashcrash, event.params.roundHash);
  round.startBlock = VALUES.ZERO;
  round.save();
}

export function handleBetPlaced(event: BetPlacedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);
  const lootTable = getLootTable(hashcrash.lootTable);

  const round = getOrCreateRound(hashcrash, event.params.roundHash);
  const player = getOrCreatePlayer(hashcrash, event.params.user);

  const bet = getOrCreateBet(round, player, event.params.index);
  bet.amount = event.params.amount;
  bet.multiplier = lootTable.multipliers[event.params.cashoutIndex.toI32()];
  bet.cashoutIndex = event.params.cashoutIndex;
  bet.save();
}

export function handleBetCashoutUpdated(event: BetCashoutUpdatedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);
  const round = getOrCreateRound(hashcrash, event.params.roundHash);
  const lootTable = getLootTable(hashcrash.lootTable);

  const bet = getBet(round, event.params.index);
  bet.multiplier = lootTable.multipliers[event.params.cashoutIndex.toI32()];
  bet.cashoutIndex = event.params.cashoutIndex;
  bet.save();
}

export function handleBetCancelled(event: BetCancelledEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);
  const round = getOrCreateRound(hashcrash, event.params.roundHash);

  const bet = getBet(round, event.params.index);
  bet.cancelled = true;
  bet.save();
}

export function handleActiveUpdated(event: ActiveUpdatedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);
  hashcrash.active = event.params.active;
  hashcrash.save();
}

export function handleLootTableUpdated(event: LootTableUpdatedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);
  const lootTable = getOrCreateLootTable(event.params.lootTable);

  hashcrash.lootTable = lootTable.id;
  hashcrash.save();
}

export function handleLiquidityAdded(event: LiquidityAddedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);

  const hashCrashStats = new HashCrashStats(hashcrash, event.block.timestamp);
  hashCrashStats.registerUserAddress(event.params.user);
  hashCrashStats.save();
  
  const userPoints = new Points(hashcrash, getOrCreateWallet(event.params.user), event.block.timestamp);

  const liquidity = new Liquidity(hashcrash, event.block.timestamp);
  liquidity.handleDeposit(event.params.shareDelta, event.params.tokenDelta);
  liquidity.save();

  const liquidityProvider = new LiquidityProvider(hashcrash, liquidity.id, event.params.user, event.block.timestamp);
  liquidityProvider.handleDeposit(event.params.shareDelta, event.params.tokenDelta);
  liquidityProvider.save();

  userPoints.accrueLiquidityPoints(liquidityProvider, event.block.number);
  userPoints.save();
}

export function handleLiquidityRemoved(event: LiquidityRemovedEvent): void {
  const hashcrash = getOrCreateHashCrash(event.address);

  const hashCrashStats = new HashCrashStats(hashcrash, event.block.timestamp);
  hashCrashStats.registerUserAddress(event.params.user);
  hashCrashStats.save();

  const userPoints = new Points(hashcrash, getOrCreateWallet(event.params.user), event.block.timestamp);

  const liquidity = new Liquidity(hashcrash, event.block.timestamp);
  liquidity.handleWithdrawal(event.params.shareDelta, event.params.tokenDelta);
  liquidity.save();

  const liquidityProvider = new LiquidityProvider(hashcrash, liquidity.id, event.params.user, event.block.timestamp);
  liquidityProvider.handleWithdrawal(event.params.shareDelta, event.params.tokenDelta);
  liquidityProvider.save();
  
  userPoints.accrueLiquidityPoints(liquidityProvider, event.block.number);
  userPoints.save();
}
