import {
  OwnershipTransferred as OwnershipTransferredEvent,
  PlatformSet as PlatformSetEvent,
  Referral as ReferralEvent,
  ReferralRewardSet as ReferralRewardSetEvent,
  RewardClaimed as RewardClaimedEvent,
  RewardEarned as RewardEarnedEvent
} from "../generated/PlatformInterface/PlatformInterface"
import {
  OwnershipTransferred,
  PlatformSet,
  Referral,
  ReferralRewardSet,
  RewardClaimed,
  RewardEarned
} from "../generated/schema"

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePlatformSet(event: PlatformSetEvent): void {
  let entity = new PlatformSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.platform = event.params.platform

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleReferral(event: ReferralEvent): void {
  let entity = new Referral(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.referrer = event.params.referrer

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleReferralRewardSet(event: ReferralRewardSetEvent): void {
  let entity = new ReferralRewardSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.level = event.params.level
  entity.bps = event.params.bps

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRewardClaimed(event: RewardClaimedEvent): void {
  let entity = new RewardClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.token = event.params.token
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRewardEarned(event: RewardEarnedEvent): void {
  let entity = new RewardEarned(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.token = event.params.token
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
