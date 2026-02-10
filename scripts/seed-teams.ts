import axios from "axios";
import { promises as fs } from "fs";
import path from "path";
import { ALIAS_MAP, normalizeName } from "../src/utils/teamNormalization";

const API_URL = "https://v3.football.api-sports.io/teams";
// const LEAGUE_IDS = [39, 135, 140, 78, 61];
const LEAGUE_IDS = [135];
const SEASONS = [2022, 2023];
const OUTPUT_PATH = path.resolve(__dirname, "..", "src", "data", "teams_db.json");
const DICTIONARY_PATH = path.resolve(__dirname, "..", "src", "data", "teams_dictionary.json");

const API_KEY = process.env.API_FOOTBALL_KEY;

type TeamEntry = {
  id: number;
  name: string;
  code: string | null;
  country: string;
};

async function fetchTeams(leagueId: number, season: number): Promise<TeamEntry[]> {
  const response = await axios.get(API_URL, {
    headers: { "x-apisports-key": API_KEY },
    params: { league: leagueId, season }
  });

  const items = response.data?.response ?? [];
  return items.map((item: { team: TeamEntry }) => ({
    id: item.team.id,
    name: item.team.name,
    code: item.team.code ?? null,
    country: item.team.country
  }));
}

async function seedTeams() {
  if (!API_KEY) {
    throw new Error("Missing API_FOOTBALL_KEY environment variable.");
  }

  const teamMap = new Map<number, TeamEntry>();

  for (const leagueId of LEAGUE_IDS) {
    for (const season of SEASONS) {
      try {
        const teams = await fetchTeams(leagueId, season);
        for (const team of teams) {
          if (!teamMap.has(team.id)) {
            teamMap.set(team.id, team);
          }
        }
        console.log(`Fetched ${teams.length} teams for league ${leagueId}, season ${season}.`);
      } catch (error) {
        console.error(`Error fetching league ${leagueId}, season ${season}:`, error);
      }
    }
  }

  const allTeams = Array.from(teamMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  const dictionary: Record<string, { id: number; name: string }> = {};
  for (const team of allTeams) {
    const key = normalizeName(team.name);
    if (key) {
      dictionary[key] = { id: team.id, name: team.name };
    }
  }

  for (const [aliasKey, officialName] of Object.entries(ALIAS_MAP)) {
    const target = allTeams.find((team) => team.name === officialName);
    if (target) {
      dictionary[aliasKey] = { id: target.id, name: target.name };
    }
  }

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(allTeams, null, 2), "utf-8");
  await fs.writeFile(DICTIONARY_PATH, JSON.stringify(dictionary, null, 2), "utf-8");

  console.log(`Saved ${allTeams.length} teams to ${OUTPUT_PATH}.`);
  console.log(`Saved ${Object.keys(dictionary).length} entries to ${DICTIONARY_PATH}.`);
}

seedTeams().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
