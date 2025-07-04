import { QuoterV2, QuoterV2__quoteExactInputSingleInputParamsStruct } from "./../../generated/HashCrashWeth/QuoterV2";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

// TODO: This only works for mainnet
const quoterAddress = Address.fromString("0x728BD3eC25D5EDBafebB84F3d67367Cd9EBC7693");

const weth = ethereum.Value.fromAddress(Address.fromString("0x3439153EB7AF838Ad19d56E1571FBD09333C2809"));
const usd = ethereum.Value.fromAddress(Address.fromString("0x84A71ccD554Cc1b02749b35d22F684CC8ec987e1"));
const fiveHundred = ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(500));
const zero = ethereum.Value.fromUnsignedBigInt(BigInt.fromString("0"));

export function ethToUSDC(amount: BigInt): BigInt {
  const quoter = QuoterV2.bind(quoterAddress);

  const struct = new QuoterV2__quoteExactInputSingleInputParamsStruct(5);
  struct[0] = weth;
  struct[1] = usd;
  struct[2] = ethereum.Value.fromUnsignedBigInt(amount);
  struct[3] = fiveHundred;
  struct[4] = zero;

  const response = quoter.quoteExactInputSingle(struct);
  return response.getAmountOut();
}
