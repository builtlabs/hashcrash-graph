import { BigInt } from "@graphprotocol/graph-ts";
import { Bet, Player, Round } from "../../generated/schema";
import { VALUES } from "../helpers";

export function getBet(round: Round, index: BigInt): Bet {
  const id = round.id + "-" + index.toHexString();
  const bet = Bet.load(id);

  if (bet == null) {
    throw new Error("Bet not found: " + id);
  }

  return bet as Bet;
}

export function getOrCreateBet(round: Round, player: Player, index: BigInt): Bet {
  const id = round.id + "-" + index.toHexString();

  let bet = Bet.load(id);
  if (bet == null) {
    bet = new Bet(id);
    bet.round = round.id;
    bet.player = player.id;
    bet.amount = VALUES.ZERO;
    bet.multiplier = VALUES.ZERO;
    bet.cashoutIndex = VALUES.ZERO;
    bet.cancelled = false;
    bet.save();
  }

  return bet as Bet;
}
