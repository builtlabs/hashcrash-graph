import { Address, BigInt } from "@graphprotocol/graph-ts";
import { HashCrash, LiquidityProvider as LiquidityProviderData, LiquidityProviderStats } from "../../generated/schema";
import { formatDateFromTimestamp, PERIOD, VALUES } from "../helpers";
import { getOrCreateWallet } from "./common";

export class LiquidityProvider {
  private wrapped: LiquidityProviderData;
  private stats: LiquidityProviderStats[] = [];

  constructor(hashCrash: HashCrash, liquidityId: string, user: Address, timestamp: BigInt) {
    this.wrapped = getOrCreateLiquidityProvider(liquidityId, user);

    this.stats = [this.getOrCreateStats(PERIOD.LIFETIME, null), this.getOrCreateStats(PERIOD.DAY, formatDateFromTimestamp(timestamp))];

    if (hashCrash.currentSeason != null) {
      this.stats.push(this.getOrCreateStats(PERIOD.SEASON, hashCrash.currentSeason));
    }
  }

  get shares(): BigInt {
    return this.stats[0].shares; // Lifetime shares
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

  private getOrCreateStats(periodType: string, periodId: string | null): LiquidityProviderStats {
    let id = this.wrapped.id + "-" + periodType;
    if (periodId !== null) {
      id += "-" + periodId;
    }

    let stats = LiquidityProviderStats.load(id);
    if (stats == null) {
      stats = new LiquidityProviderStats(id);
      stats.liquidityProvider = this.wrapped.id;
      stats.periodType = periodType;
      stats.periodId = periodId;

      stats.shares = VALUES.ZERO;
      stats.depositCount = VALUES.ZERO;
      stats.depositVolume = VALUES.ZERO;
      stats.withdrawalCount = VALUES.ZERO;
      stats.withdrawalVolume = VALUES.ZERO;

      stats.save();
    }
    return stats as LiquidityProviderStats;
  }
}

function getOrCreateLiquidityProvider(liquidityId: string, user: Address): LiquidityProviderData {
    const wallet = getOrCreateWallet(user);
    const id = liquidityId + "-" + wallet.id;

    let wrapped = LiquidityProviderData.load(id);
    if (wrapped == null) {
      wrapped = new LiquidityProviderData(id);
      wrapped.wallet = wallet.id;
      wrapped.liquidity = liquidityId;
      wrapped.save();
    }

    return wrapped as LiquidityProviderData;
  }