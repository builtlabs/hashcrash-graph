import { Address, BigInt } from "@graphprotocol/graph-ts";
import { HashCrash, HashCrashStats as Stats, UniqueChecker } from "../../generated/schema";
import { addressToId, format15MinBucket, formatDateFromTimestamp, PERIOD, VALUES } from "../helpers";

export class HashCrashStats {
  private stats: Stats[] = [];

  constructor(hashcrash: HashCrash, timestamp: BigInt) {
    this.stats = [
      this.getOrCreateStats(hashcrash, PERIOD.LIFETIME, null),
      this.getOrCreateStats(hashcrash, PERIOD.DAY, formatDateFromTimestamp(timestamp)),
      this.getOrCreateStats(hashcrash, PERIOD.FIFTEEN_MINUTES, format15MinBucket(timestamp)),
    ];

    if (hashcrash.currentSeason != null) {
      this.stats.push(this.getOrCreateStats(hashcrash, PERIOD.SEASON, hashcrash.currentSeason));
    }
  }

  public registerUserAddress(user: Address): void {
    this.registerUserId(addressToId(user));
  }

  public registerUserId(userId: string): void {
    for (let i = 0; i < this.stats.length; i++) {
      if (this.isUniqueUser(userId, this.stats[i].id)) {
        this.stats[i].uniqueUserCount = this.stats[i].uniqueUserCount.plus(VALUES.ONE);
      }
    }
  }

  public registerRound(): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].roundCount = this.stats[i].roundCount.plus(VALUES.ONE);
    }
  }

  public registerBet(amount: BigInt): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].betCount = this.stats[i].betCount.plus(VALUES.ONE);
      this.stats[i].betVolume = this.stats[i].betVolume.plus(amount);
    }
  }

  public registerWin(amount: BigInt): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].winCount = this.stats[i].winCount.plus(VALUES.ONE);
      this.stats[i].winVolume = this.stats[i].winVolume.plus(amount);
    }
  }

  public save(): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].save();
    }
  }

  private getOrCreateStats(hashcrash: HashCrash, periodType: string, periodId: string | null): Stats {
    let id = hashcrash.id + "-" + periodType;
    if (periodId !== null) {
      id += "-" + periodId;
    }

    let stats = Stats.load(id);
    if (stats == null) {
      stats = new Stats(id);
      stats.hashcrash = hashcrash.id;
      stats.periodType = periodType;
      stats.periodId = periodId;

      stats.betCount = VALUES.ZERO;
      stats.betVolume = VALUES.ZERO;
      stats.winCount = VALUES.ZERO;
      stats.winVolume = VALUES.ZERO;
      stats.roundCount = VALUES.ZERO;
      stats.uniqueUserCount = VALUES.ZERO;

      stats.save();
    }
    return stats as Stats;
  }

  private isUniqueUser(userId: string, statsId: string): boolean {
    let uniqueId = statsId + "-" + userId;

    let uniqueUser = UniqueChecker.load(uniqueId);
    if (uniqueUser == null) {
      uniqueUser = new UniqueChecker(uniqueId);
      uniqueUser.save();
      return true;
    }

    return false;
  }
}
