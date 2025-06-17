import { BigInt } from "@graphprotocol/graph-ts";
import {
  SeasonStarted as SeasonStartedEvent,
  SeasonEnded as SeasonEndedEvent,
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
  getWallet,
  PlatformToken,
  PlatformUser,
  PlatformUserReward,
  Points,
} from "./objects";
import { addressToId } from "./helpers";

export function handleSeasonStarted(event: SeasonStartedEvent): void {
  const platformInterface = getOrCreatePlatformInterface(event.address);

  const season = getOrCreateSeason(platformInterface, event.params.season);
  season.startBlock = event.block.number;
  season.save();

  platformInterface.currentSeason = season.id;
  platformInterface.save();

  for (let i = 0; i < event.params.gamemodes.length; i++) {
    const hashcrash = getHashcrash(addressToId(event.params.gamemodes[i]));
    hashcrash.currentSeason = season.id;
    hashcrash.save();

    const providers = getLiquidity(hashcrash.liquidity).providers.load();
    for (let j = 0; j < providers.length; j++) {
      new Points(hashcrash, getWallet(providers[j].wallet), event.block.timestamp);
    }
  }
}

export function handleSeasonEnded(event: SeasonEndedEvent): void {
  const platformInterface = getOrCreatePlatformInterface(event.address);
  platformInterface.currentSeason = null;
  platformInterface.save();

  const season = getOrCreateSeason(platformInterface, event.params.season);
  season.endBlock = event.block.number;
  season.save();

  // TODO: This removes the history, which it probably shouldn't.
  const hashcrashReferences = season.hashcrashReferences.load();
  for (let i = 0; i < hashcrashReferences.length; i++) {
    hashcrashReferences[i].currentSeason = null;
    hashcrashReferences[i].save();
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
