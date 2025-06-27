import { LiquidityProviderStats, Player, Wallet } from "./../../generated/schema";
import { formatDateFromTimestamp, PERIOD, VALUES } from "../helpers";
import { HashCrash, PlatformInterface, Points as PointsStats } from "../../generated/schema";

import { BigInt } from "@graphprotocol/graph-ts";
import { getWallet } from "./common";
import { getSeasonOrNull } from "./season";
import { LiquidityProvider } from "./liquidity-provider";
import { getPlatformUserOrNull } from "./platform-user";
import { getPlatformInterface } from "./platform-interface";

export class Points {
  private wallet: Wallet;
  private stats: PointsStats[] = [];

  constructor(hashcrash: HashCrash, wallet: Wallet, timestamp: BigInt) {
    this.wallet = wallet;
    this.stats = [
      this.getOrCreateStats(PERIOD.LIFETIME, null, null),
      this.getOrCreateStats(PERIOD.DAY, formatDateFromTimestamp(timestamp), null),
    ];

    if (hashcrash.currentSeason != null) {
      this.stats.push(this.getOrCreateStats(PERIOD.SEASON, hashcrash.currentSeason, hashcrash.currentSeason));
    }
  }

  public incrementVolume(volume: BigInt, timestamp: BigInt): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].volume = this.stats[i].volume.plus(volume.times(volumeMultiplier(timestamp)));
    }
  }

  public incrementReferredVolume(volume: BigInt, timestamp: BigInt): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].referredVolume = this.stats[i].referredVolume.plus(volume.times(volumeMultiplier(timestamp)));
    }
  }

  public accrueLiquidityPoints(provider: LiquidityProvider, blockNumber: BigInt): void {
    for (let i = 0; i < this.stats.length; i++) {
      const pointStats = this.stats[i];
      if (
        pointStats.latestLiquidity.gt(VALUES.ZERO) &&
        pointStats.latestLiquidityBlock.gt(VALUES.ZERO) &&
        pointStats.latestLiquidityBlock.lt(blockNumber)
      ) {
        const diff = blockNumber.minus(pointStats.latestLiquidityBlock);
        const accrued = diff.times(pointStats.latestLiquidity);

        pointStats.accruedLiquidity = pointStats.accruedLiquidity.plus(accrued);
      }

      pointStats.latestLiquidity = provider.shares;
      pointStats.latestLiquidityBlock = blockNumber;
    }
  }

  public save(): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].save();
    }
  }

  private getOrCreateStats(periodType: string, periodId: string | null, seasonId: string | null): PointsStats {
    let id = this.wallet.id + "-" + periodType;
    if (periodId !== null) {
      id += "-" + periodId;
    }

    let stats = PointsStats.load(id);
    if (stats == null) {
      stats = new PointsStats(id);

      stats.wallet = this.wallet.id;
      stats.periodType = periodType;
      stats.periodId = periodId;
      stats.season = seasonId;

      stats.volume = VALUES.ZERO;
      stats.referredVolume = VALUES.ZERO;
      stats.accruedLiquidity = VALUES.ZERO;
      stats.latestLiquidity = VALUES.ZERO;
      stats.latestLiquidityBlock = VALUES.ZERO;

      const liquidityProviders = this.wallet.liquidityProviders.load();
      for (let i = 0; i < liquidityProviders.length; i++) {
        const lifeTime = LiquidityProviderStats.load(liquidityProviders[i].id + "-" + PERIOD.LIFETIME);
        if (lifeTime != null) {
          // TODO: This needs to be converted to eth if the token is not address(0).
          // Potentially like this:
          // const liquidity = Liquidity.load(liquidityProviders[i].id)!;
          // const hashcrash = HashCrash.load(liquidity.hashcrash)!;
          // const token = hashcrash.token;
          // But, might be better to push token lower down the data structure.

          stats.latestLiquidity = stats.latestLiquidity.plus(lifeTime.shares);
        }
      }

      const season = getSeasonOrNull(seasonId);
      if (season != null) {
        stats.latestLiquidityBlock = season.startBlock;
      }

      stats.save();
    }
    return stats as PointsStats;
  }
}

export function accrueVolumePoints(hashcrash: HashCrash, player: Player, volume: BigInt, timestamp: BigInt): void {
  const wallet = getWallet(player.wallet);

  const user = new Points(hashcrash, wallet, timestamp);
  user.incrementVolume(volume, timestamp);
  user.save();

  const platformUser = getPlatformUserOrNull(wallet.platformUser);
  if (platformUser != null) {
    const platformInterface = getPlatformInterface(platformUser.platformInterface);

    let depth = 0;
    let rate = getRewardRate(platformInterface, depth);
    let referer = getPlatformUserOrNull(platformUser.referredBy);

    while (referer != null && rate.gt(VALUES.ZERO)) {
      const referredVolume = applyRate(volume, rate);

      const referredPoints = new Points(hashcrash, getWallet(referer.wallet), timestamp);
      referredPoints.incrementReferredVolume(referredVolume, timestamp);
      referredPoints.save();

      depth++;
      rate = getRewardRate(platformInterface, depth);
      referer = getPlatformUserOrNull(referer.referredBy);
    }
  }
}

function getRewardRate(platformInterface: PlatformInterface, depth: i32): BigInt {
  if (platformInterface.rewardRates.length <= depth) {
    return VALUES.ZERO;
  }

  return platformInterface.rewardRates[depth];
}

function applyRate(value: BigInt, rate: BigInt): BigInt {
  const multiplied = value.times(rate);
  return multiplied.div(VALUES.DENOMINATOR);
}

function volumeMultiplier(timestamp: BigInt): BigInt {
  // Weekend one:
  if (timestamp.ge(BigInt.fromI64(1751036400)) && timestamp.lt(BigInt.fromI64(1751270400))) {
    return VALUES.TWO;
  }

  return VALUES.ONE;
}
