import { BigInt } from "@graphprotocol/graph-ts";
import { PlatformInterface, PlatformToken as PlatformTokenData, PlatformTokenStats, Token } from "../../generated/schema";
import { formatDateFromTimestamp, PERIOD, VALUES } from "../helpers";

export class PlatformToken {
  private wrapped: PlatformTokenData;
  private stats: PlatformTokenStats[] = [];

  constructor(platformInterface: PlatformInterface, token: Token, timestamp: BigInt) {
    this.wrapped = getOrCreatePlatformToken(platformInterface, token);
    this.stats = [this.getOrCreateStats(PERIOD.LIFETIME, null), this.getOrCreateStats(PERIOD.DAY, formatDateFromTimestamp(timestamp))];

    if (platformInterface.currentSeason != null) {
      this.stats.push(this.getOrCreateStats(PERIOD.SEASON, platformInterface.currentSeason));
    }
  }

  get id(): string {
    return this.wrapped.id;
  }

  public incrementFeeVolume(amount: BigInt): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].feeVolume = this.stats[i].feeVolume.plus(amount);
    }
  }

  public incrementClaimVolume(amount: BigInt): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].claimVolume = this.stats[i].claimVolume.plus(amount);
    }
  }

  public save(): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].save();
    }
  }

  private getOrCreateStats(periodType: string, periodId: string | null): PlatformTokenStats {
    let id = this.wrapped.id + "-" + periodType;
    if (periodId !== null) {
      id += "-" + periodId;
    }

    let stats = PlatformTokenStats.load(id);
    if (stats == null) {
      stats = new PlatformTokenStats(id);
      stats.platformToken = this.wrapped.id;
      stats.periodType = periodType;
      stats.periodId = periodId;

      stats.feeVolume = VALUES.ZERO;
      stats.claimVolume = VALUES.ZERO;

      stats.save();
    }
    return stats as PlatformTokenStats;
  }
}

function getOrCreatePlatformToken(platformInterface: PlatformInterface, token: Token): PlatformTokenData {
  const id = platformInterface.id + "-" + token.id;

  let platformToken = PlatformTokenData.load(id);
  if (platformToken == null) {
    platformToken = new PlatformTokenData(id);
    platformToken.token = token.id;
    platformToken.platformInterface = platformInterface.id;
    platformToken.save();
  }

  return platformToken as PlatformTokenData;
}
