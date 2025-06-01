import { Address } from "@graphprotocol/graph-ts";
import { HashCrash, Player } from "../../generated/schema";
import { addressToId } from "../helpers";
import { getOrCreateWallet } from "./common";

export function getPlayer(id: string): Player {
  const player = Player.load(id);
  if (player == null) {
    throw new Error("Player not found: " + id);
  }
  return player as Player;
}

export function getOrCreatePlayer(hashcrash: HashCrash, address: Address): Player {
  const id = hashcrash.id + "-" + addressToId(address);

  let player = Player.load(id);
  if (player == null) {
    player = new Player(id);
    player.wallet = getOrCreateWallet(address).id;
    player.hashcrash = hashcrash.id;
    player.save();
  }

  return player as Player;
}
