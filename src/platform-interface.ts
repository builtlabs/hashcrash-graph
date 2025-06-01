import { BigInt } from "@graphprotocol/graph-ts";
import {
  StartSeason as StartSeasonEvent,
  PlatformSet as PlatformSetEvent,
  Referral as ReferralEvent,
  ReferralRewardSet as ReferralRewardSetEvent,
  RewardClaimed as RewardClaimedEvent,
  RewardEarned as RewardEarnedEvent,
} from "../generated/PlatformInterface/PlatformInterface";
import {
  getHashcrash,
  getLiquidity,
  getOrCreatePlatformInterface,
  getOrCreateSeason,
  getOrCreateToken,
  getSeason,
  getWallet,
  PlatformToken,
  PlatformUser,
  PlatformUserReward,
  Points,
} from "./objects";
import { addressToId } from "./helpers";

export function handleStartSeason(event: StartSeasonEvent): void {
  const platformInterface = getOrCreatePlatformInterface(event.address);

  if (platformInterface.currentSeason != null) {
    const previousSeason = getSeason(platformInterface.currentSeason as string);
    previousSeason.endBlock = event.block.number;
    previousSeason.save();

    const previousGameModes = previousSeason.hashcrashReferences.load();
    for (let i = 0; i < previousGameModes.length; i++) {
      previousGameModes[i].currentSeason = null;
      previousGameModes[i].save();
    }
  }

  const newSeason = getOrCreateSeason(platformInterface, event.params.season);
  newSeason.startBlock = event.block.number;
  newSeason.save();

  for (let i = 0; i < event.params.gamemodes.length; i++) {
    const hashcrash = getHashcrash(addressToId(event.params.gamemodes[i]));
    hashcrash.currentSeason = newSeason.id;
    hashcrash.save();

    const providers = getLiquidity(hashcrash.liquidity).providers.load();
    for (let j = 0; j < providers.length; j++) {
      new Points(hashcrash, getWallet(providers[j].wallet), event.block.timestamp);
    }
  }
}

export function handlePlatformSet(event: PlatformSetEvent): void {
  const platform = getOrCreatePlatformInterface(event.address);
  const user = new PlatformUser(platform, event.params.platform, event.block.timestamp);
  platform.house = user.id;
  platform.save();
}

export function handleReferral(event: ReferralEvent): void {
  const platform = getOrCreatePlatformInterface(event.address);

  const referrer = new PlatformUser(platform, event.params.referrer, event.block.timestamp);
  referrer.incrementReferrals();
  referrer.save();

  const user = new PlatformUser(platform, event.params.user, event.block.timestamp);
  user.referredBy = referrer.id;
  user.save();
}

export function handleReferralRewardSet(event: ReferralRewardSetEvent): void {
  const platform = getOrCreatePlatformInterface(event.address);
  const rewards = platform.rewardRates;
  const index = event.params.index.toI32();

  while (rewards.length <= index) {
    rewards.push(BigInt.zero());
  }

  rewards[index] = event.params.numerator;
  platform.rewardRates = rewards;
  platform.save();
}

export function handleRewardEarned(event: RewardEarnedEvent): void {
  const token = getOrCreateToken(event.params.token);

  const platform = getOrCreatePlatformInterface(event.address);
  const platformUser = new PlatformUser(platform, event.params.user, event.block.timestamp);

  const platformToken = new PlatformToken(platform, token, event.block.timestamp);
  platformToken.incrementFeeVolume(event.params.amount);
  platformToken.save();

  const platformUserReward = new PlatformUserReward(platform, platformUser.id, platformToken.id, event.block.timestamp);
  platformUserReward.incrementEarnings(event.params.amount);
  platformUserReward.save();
}

export function handleRewardClaimed(event: RewardClaimedEvent): void {
  const token = getOrCreateToken(event.params.token);

  const platform = getOrCreatePlatformInterface(event.address);
  const platformUser = new PlatformUser(platform, event.params.user, event.block.timestamp);

  const platformToken = new PlatformToken(platform, token, event.block.timestamp);
  platformToken.incrementClaimVolume(event.params.amount);
  platformToken.save();

  const platformUserReward = new PlatformUserReward(platform, platformUser.id, platformToken.id, event.block.timestamp);
  platformUserReward.incrementClaimed(event.params.amount);
  platformUserReward.save();
}
