import Fuse from "fuse.js";
import teamsJson from "../data/teams_db.json";
import { ALIAS_MAP, normalizeName, normalizeStrict } from "./teamNormalization";

type TeamEntry = {
  id: number;
  name: string;
  code: string | null;
  country: string;
};

const TEAMS = teamsJson as TeamEntry[];

const fuse = new Fuse(TEAMS, {
  includeScore: true,
  threshold: 0.3,
  ignoreLocation: true,
  keys: ["name", "code"]
});

const exactNameIndex = new Map<string, TeamEntry>();
const normalizedNameIndex = new Map<string, TeamEntry>();
for (const team of TEAMS) {
  exactNameIndex.set(normalizeStrict(team.name), team);
  normalizedNameIndex.set(normalizeName(team.name), team);
}

export function findTeam(input: string): TeamEntry | null {
  if (!input || !input.trim()) {
    return null;
  }

  const normalizedInput = normalizeName(input);
  const aliasTarget = ALIAS_MAP[normalizedInput];
  if (aliasTarget) {
    const aliasMatch = exactNameIndex.get(normalizeStrict(aliasTarget));
    if (aliasMatch) {
      return aliasMatch;
    }
  }

  const exactNormalized = normalizedNameIndex.get(normalizedInput);
  if (exactNormalized) {
    return exactNormalized;
  }

  const result = fuse.search(normalizedInput);
  if (!result.length) {
    return null;
  }

  const best = result[0];
  if (best.score === undefined || best.score > 0.3) {
    return null;
  }

  return best.item;
}
