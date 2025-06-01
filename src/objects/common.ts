import { Address } from "@graphprotocol/graph-ts";
import { Token, Wallet } from "../../generated/schema";
import { addressToId } from "../helpers";

export function getWallet(id: string): Wallet {
  const wallet = Wallet.load(id);

  if (wallet == null) {
    throw new Error("Wallet not found: " + id);
  }

  return wallet as Wallet;
}

export function getOrCreateWallet(address: Address): Wallet {
  const id = addressToId(address);

  let wallet = Wallet.load(id);
  if (wallet == null) {
    wallet = new Wallet(id);
    wallet.save();
  }

  return wallet as Wallet;
}

export function getOrCreateToken(address: Address): Token {
  const id = addressToId(address, true);

  let token = Token.load(id);
  if (token == null) {
    token = new Token(id);
    token.save();
  }

  return token as Token;
}
