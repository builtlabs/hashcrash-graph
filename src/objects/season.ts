import { BigInt } from "@graphprotocol/graph-ts";
import { PlatformInterface, Season } from "../../generated/schema";
import { VALUES } from "../helpers";

export function getSeasonOrNull(seasonId: string | null): Season | null {
  if (seasonId == null) {
    return null;
  }

  return Season.load(seasonId as string);
}

export function getOrCreateSeason(platformInterface: PlatformInterface, seasonIndex: BigInt): Season {
  const id = platformInterface.id + "-" + seasonIndex.toHexString();

  let season = Season.load(id);
  if (season == null) {
    season = new Season(id);
    season.seasonIndex = seasonIndex;
    season.startBlock = VALUES.ZERO;
    season.save();
  }

  return season as Season;
}
