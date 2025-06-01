import { BigInt } from "@graphprotocol/graph-ts";
import { HashCrash, Player, PlayerStats as PlayerStatsInternal, UniqueChecker } from "../../generated/schema";
import { formatDateFromTimestamp, PERIOD, VALUES } from "../helpers";

export class PlayerStats {
  private stats: PlayerStatsInternal[] = [];

  constructor(hashcrash: HashCrash, player: Player, timestamp: BigInt) {
    this.stats = [
      this.getOrCreateStats(player, PERIOD.LIFETIME, null),
      this.getOrCreateStats(player, PERIOD.DAY, formatDateFromTimestamp(timestamp)),
    ];

    if (hashcrash.currentSeason != null) {
      this.stats.push(this.getOrCreateStats(player, PERIOD.SEASON, hashcrash.currentSeason));
    }
  }

  public handleBetPlaced(roundId: string, amount: BigInt, multiplierUsed: BigInt): void {
    for (let i = 0; i < this.stats.length; i++) {
      if (this.isUniqueRound(roundId, this.stats[i].id)) {
        this.stats[i].roundCount = this.stats[i].roundCount.plus(BigInt.fromI32(1));
      }

      this.stats[i].betCount = this.stats[i].betCount.plus(BigInt.fromI32(1));
      this.stats[i].betVolume = this.stats[i].betVolume.plus(amount);

      if (this.stats[i].largestBet.lt(amount)) {
        this.stats[i].largestBet = amount;
      }

      if (this.stats[i].largestMultiplierUsed.lt(multiplierUsed)) {
        this.stats[i].largestMultiplierUsed = multiplierUsed;
      }
    }
  }

  public handleBetWon(payout: BigInt, profit: BigInt, multiplierWon: BigInt): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].winCount = this.stats[i].winCount.plus(BigInt.fromI32(1));
      this.stats[i].payoutVolume = this.stats[i].payoutVolume.plus(payout);
      this.stats[i].profitVolume = this.stats[i].profitVolume.plus(profit);

      if (this.stats[i].largestPayout.lt(payout)) {
        this.stats[i].largestPayout = payout;
      }

      if (this.stats[i].largestProfit.lt(profit)) {
        this.stats[i].largestProfit = profit;
      }

      if (this.stats[i].largestMultiplierWon.lt(multiplierWon)) {
        this.stats[i].largestMultiplierWon = multiplierWon;
      }
    }
  }

  public save(): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].save();
    }
  }

  private getOrCreateStats(player: Player, periodType: string, periodId: string | null): PlayerStatsInternal {
    let id = player.id + "-" + periodType;
    if (periodId !== null) {
      id += "-" + periodId;
    }

    let stats = PlayerStatsInternal.load(id);
    if (stats == null) {
      stats = new PlayerStatsInternal(id);
      stats.player = player.id;
      stats.periodType = periodType;
      stats.periodId = periodId;

      stats.roundCount = VALUES.ZERO;
      stats.betCount = VALUES.ZERO;
      stats.betVolume = VALUES.ZERO;
      stats.winCount = VALUES.ZERO;
      stats.payoutVolume = VALUES.ZERO;
      stats.profitVolume = VALUES.ZERO;
      stats.largestBet = VALUES.ZERO;
      stats.largestPayout = VALUES.ZERO;
      stats.largestProfit = VALUES.ZERO;
      stats.largestMultiplierUsed = VALUES.ZERO;
      stats.largestMultiplierWon = VALUES.ZERO;

      stats.save();
    }
    return stats as PlayerStatsInternal;
  }

  private isUniqueRound(roundId: string, statsId: string): boolean {
    let uniqueId = statsId + "-" + roundId;

    let uniqueUser = UniqueChecker.load(uniqueId);
    if (uniqueUser == null) {
      uniqueUser = new UniqueChecker(uniqueId);
      uniqueUser.save();
      return true;
    }

    return false;
  }
}
