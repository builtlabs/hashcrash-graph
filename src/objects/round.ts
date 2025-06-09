import { Bytes } from "@graphprotocol/graph-ts";
import { HashCrash, Round } from "../../generated/schema";
import { VALUES } from "../helpers";

export function getOrCreateRound(hashcrash: HashCrash, hash: Bytes): Round {
  const id = hashcrash.id + "-" + hash.toHexString();

  let round = Round.load(id);
  if (round == null) {
    round = new Round(id);
    round.hashcrash = hashcrash.id;
    round.hash = hash;
    round.hashIndex = VALUES.ZERO;
    round.startBlock = VALUES.ZERO;
    round.nextBetIndex = VALUES.ZERO;
    round.save();
  }

  return round as Round;
}
