import { BigInt } from "@graphprotocol/graph-ts";
import { PlatformInterface, PlatformUserReward as PlatformUserRewardData, PlatformUserRewardStats } from "../../generated/schema";
import { formatDateFromTimestamp, PERIOD, VALUES } from "../helpers";

export class PlatformUserReward {
  private wrapped: PlatformUserRewardData;
  private stats: PlatformUserRewardStats[] = [];

  constructor(platformInterface: PlatformInterface, platformUserId: string, platformTokenId: string, timestamp: BigInt) {
    this.wrapped = getOrCreatePlatformUserRewards(platformUserId, platformTokenId);
    this.stats = [this.getOrCreateStats(PERIOD.LIFETIME, null), this.getOrCreateStats(PERIOD.DAY, formatDateFromTimestamp(timestamp))];

    if (platformInterface.currentSeason != null) {
      this.stats.push(this.getOrCreateStats(PERIOD.SEASON, platformInterface.currentSeason));
    }
  }

  public incrementEarnings(amount: BigInt): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].earnings = this.stats[i].earnings.plus(amount);
    }
  }

  public incrementClaimed(amount: BigInt): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].claimed = this.stats[i].claimed.plus(amount);
    }
  }

  public save(): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].save();
    }
  }

  private getOrCreateStats(periodType: string, periodId: string | null): PlatformUserRewardStats {
    let id = this.wrapped.id + "-" + periodType;
    if (periodId !== null) {
      id += "-" + periodId;
    }

    let stats = PlatformUserRewardStats.load(id);
    if (stats == null) {
      stats = new PlatformUserRewardStats(id);
      stats.platformUserReward = this.wrapped.id;
      stats.periodType = periodType;
      stats.periodId = periodId;

      stats.earnings = VALUES.ZERO;
      stats.claimed = VALUES.ZERO;

      stats.save();
    }
    return stats as PlatformUserRewardStats;
  }
}

function getOrCreatePlatformUserRewards(platformUserId: string, platformTokenId: string): PlatformUserRewardData {
  const id = platformUserId + "-" + platformTokenId;

  let platformUserReward = PlatformUserRewardData.load(id);
  if (platformUserReward == null) {
    platformUserReward = new PlatformUserRewardData(id);
    platformUserReward.platformUser = platformUserId;
    platformUserReward.platformToken = platformTokenId;
    platformUserReward.save();
  }

  return platformUserReward as PlatformUserRewardData;
}
