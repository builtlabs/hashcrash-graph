import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  OwnershipTransferred,
  PlatformSet,
  Referral,
  ReferralRewardSet,
  RewardClaimed,
  RewardEarned
} from "../generated/PlatformInterface/PlatformInterface"

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  )

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPlatformSetEvent(platform: Address): PlatformSet {
  let platformSetEvent = changetype<PlatformSet>(newMockEvent())

  platformSetEvent.parameters = new Array()

  platformSetEvent.parameters.push(
    new ethereum.EventParam("platform", ethereum.Value.fromAddress(platform))
  )

  return platformSetEvent
}

export function createReferralEvent(
  user: Address,
  referrer: Address
): Referral {
  let referralEvent = changetype<Referral>(newMockEvent())

  referralEvent.parameters = new Array()

  referralEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  referralEvent.parameters.push(
    new ethereum.EventParam("referrer", ethereum.Value.fromAddress(referrer))
  )

  return referralEvent
}

export function createReferralRewardSetEvent(
  level: BigInt,
  bps: BigInt
): ReferralRewardSet {
  let referralRewardSetEvent = changetype<ReferralRewardSet>(newMockEvent())

  referralRewardSetEvent.parameters = new Array()

  referralRewardSetEvent.parameters.push(
    new ethereum.EventParam("level", ethereum.Value.fromUnsignedBigInt(level))
  )
  referralRewardSetEvent.parameters.push(
    new ethereum.EventParam("bps", ethereum.Value.fromUnsignedBigInt(bps))
  )

  return referralRewardSetEvent
}

export function createRewardClaimedEvent(
  user: Address,
  token: Address,
  amount: BigInt
): RewardClaimed {
  let rewardClaimedEvent = changetype<RewardClaimed>(newMockEvent())

  rewardClaimedEvent.parameters = new Array()

  rewardClaimedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  rewardClaimedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  rewardClaimedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return rewardClaimedEvent
}

export function createRewardEarnedEvent(
  user: Address,
  token: Address,
  amount: BigInt
): RewardEarned {
  let rewardEarnedEvent = changetype<RewardEarned>(newMockEvent())

  rewardEarnedEvent.parameters = new Array()

  rewardEarnedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  rewardEarnedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  rewardEarnedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return rewardEarnedEvent
}
