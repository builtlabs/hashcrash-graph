import { Address, BigInt } from "@graphprotocol/graph-ts";
import { PlatformInterface, PlatformUser as PlatformUserData, PlatformUserStats } from "../../generated/schema";
import { addressToId, formatDateFromTimestamp, PERIOD, VALUES } from "../helpers";
import { getOrCreateWallet } from "./common";

export class PlatformUser {
  private platformUser: PlatformUserData;
  private stats: PlatformUserStats[] = [];

  constructor(platformInterface: PlatformInterface, user: Address, timestamp: BigInt) {
    this.platformUser = getOrCreatePlatformUser(platformInterface, user);
    this.stats = [
      this.getOrCreateStats(PERIOD.LIFETIME, null, null),
      this.getOrCreateStats(PERIOD.DAY, formatDateFromTimestamp(timestamp), null),
    ];

    if (platformInterface.currentSeason != null) {
      this.stats.push(this.getOrCreateStats(PERIOD.SEASON, platformInterface.currentSeason, platformInterface.currentSeason));
    }
  }

  get id(): string {
    return this.platformUser.id;
  }

  get referredBy(): string | null {
    return this.platformUser.referredBy;
  }

  set referredBy(value: string) {
    this.platformUser.referredBy = value;
  }

  public incrementReferrals(): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].referralCount = this.stats[i].referralCount.plus(VALUES.ONE);
    }
  }

  public save(): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].save();
    }

    this.platformUser.save();
  }

  private getOrCreateStats(periodType: string, periodId: string | null, seasonId: string | null): PlatformUserStats {
    let id = this.platformUser.id + "-" + periodType;
    if (periodId !== null) {
      id += "-" + periodId;
    }

    let stats = PlatformUserStats.load(id);
    if (stats == null) {
      stats = new PlatformUserStats(id);
      stats.platformUser = this.platformUser.id;
      stats.periodType = periodType;
      stats.periodId = periodId;
      stats.season = seasonId;

      stats.referralCount = VALUES.ZERO;

      stats.save();
    }
    return stats as PlatformUserStats;
  }
}

export function getPlatformUserOrNull(id: string | null): PlatformUserData | null {
  if (id == null) {
    return null;
  }

  return PlatformUserData.load(id as string);
}

function getOrCreatePlatformUser(platformInterface: PlatformInterface, user: Address): PlatformUserData {
  const id = platformInterface.id + "-" + addressToId(user);

  let platformUser = PlatformUserData.load(id);
  if (platformUser == null) {
    const wallet = getOrCreateWallet(user);

    platformUser = new PlatformUserData(id);
    platformUser.wallet = wallet.id;
    platformUser.platformInterface = platformInterface.id;
    platformUser.save();

    wallet.platformUser = platformUser.id;
    wallet.save();
  }

  return platformUser as PlatformUserData;
}
