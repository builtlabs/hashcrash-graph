import { BigInt } from "@graphprotocol/graph-ts";
import { HashCrash, Liquidity as LiquidityData, LiquidityStats } from "../../generated/schema";
import { formatDateFromTimestamp, PERIOD, VALUES } from "../helpers";

export class Liquidity {
  private wrapped: LiquidityData;
  private stats: LiquidityStats[]= [];

  constructor(hashCrash: HashCrash, timestamp: BigInt) {
    this.wrapped = getOrCreateLiquidity(hashCrash);

    this.stats = [this.getOrCreateStats(PERIOD.LIFETIME, null), this.getOrCreateStats(PERIOD.DAY, formatDateFromTimestamp(timestamp))];

    if (hashCrash.currentSeason != null) {
      this.stats.push(this.getOrCreateStats(PERIOD.SEASON, hashCrash.currentSeason));
    }
  }

  get id(): string {
    return this.wrapped.id;
  }

  public handleDeposit(shares: BigInt, volume: BigInt): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].shares = this.stats[i].shares.plus(shares);
      this.stats[i].depositCount = this.stats[i].depositCount.plus(VALUES.ONE);
      this.stats[i].depositVolume = this.stats[i].depositVolume.plus(volume);
    }
  }

  public handleWithdrawal(shares: BigInt, volume: BigInt): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].shares = this.stats[i].shares.minus(shares);
      this.stats[i].withdrawalCount = this.stats[i].withdrawalCount.plus(VALUES.ONE);
      this.stats[i].withdrawalVolume = this.stats[i].withdrawalVolume.plus(volume);
    }
  }

  public save(): void {
    for (let i = 0; i < this.stats.length; i++) {
      this.stats[i].save();
    }
  }

  private getOrCreateStats(periodType: string, periodId: string | null): LiquidityStats {
    let id = this.wrapped.id + "-" + periodType;
    if (periodId !== null) {
      id += "-" + periodId;
    }

    let stats = LiquidityStats.load(id);
    if (stats == null) {
      stats = new LiquidityStats(id);
      stats.liquidity = this.wrapped.id;
      stats.periodType = periodType;
      stats.periodId = periodId;

      stats.shares = VALUES.ZERO;
      stats.depositCount = VALUES.ZERO;
      stats.depositVolume = VALUES.ZERO;
      stats.withdrawalCount = VALUES.ZERO;
      stats.withdrawalVolume = VALUES.ZERO;

      stats.save();
    }
    return stats as LiquidityStats;
  }
}

export function getLiquidity(id: string): LiquidityData {
  const liquidity = LiquidityData.load(id);
  
  if (liquidity == null) {
    throw new Error(`Liquidity with id ${id} not found`);
  }

  return liquidity as LiquidityData;
}

export function getOrCreateLiquidity(hashcrash: HashCrash): LiquidityData {
  const id = hashcrash.id;

  let liquidity = LiquidityData.load(id);
  if (liquidity == null) {
    liquidity = new LiquidityData(id);
    liquidity.hashcrash = hashcrash.id;
    liquidity.save();
  }

  return liquidity as LiquidityData;
}
