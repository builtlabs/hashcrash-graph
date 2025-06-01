import { HashCrash } from "../../generated/schema";

export function getHashcrash(id: string): HashCrash {
  const hashcrash = HashCrash.load(id);

  if (hashcrash == null) {
    throw new Error("HashCrash not found: " + id);
  }

  return hashcrash as HashCrash;
}
