import axios from "axios";
import { promises as fs } from "fs";
import path from "path";

const API_URL = "https://v3.football.api-sports.io/teams";
const SEASON = 2026;
const FALLBACK_SEASONS = [2025, 2024, 2023, 2022];
const OUTPUT_DIR = path.resolve(__dirname, "..", "src", "data", "campionati");
const LEAGUES = [
  { id: 135, file: "seriea_teams_2026.json", label: "Serie A" },
  { id: 39, file: "premierleague_teams_2026.json", label: "Premier League" },
  { id: 61, file: "ligue1_teams_2026.json", label: "Ligue 1" },
  { id: 140, file: "laliga_teams_2026.json", label: "Spanish Liga" },
  { id: 78, file: "bundesliga_teams_2026.json", label: "Bundesliga" }
] as const;

const API_KEY = process.env.API_FOOTBALL_KEY;

type LeagueConfig = (typeof LEAGUES)[number];
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
  return items
    .map((item: { team?: { id?: number; name?: string; code?: string | null; country?: string } }) => {
      const name = item.team?.name?.trim();
      const id = item.team?.id;
      const country = item.team?.country?.trim();

      if (!id || !name || !country) {
        return null;
      }

      return {
        id,
        name,
        code: item.team?.code ?? null,
        country
      };
    })
    .filter((team: TeamEntry | null): team is TeamEntry => Boolean(team));
}

async function seedTeams() {
  if (!API_KEY) {
    throw new Error("Missing API_FOOTBALL_KEY environment variable.");
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const league of LEAGUES) {
    await saveLeagueTeams(league, SEASON);
  }
}

async function saveLeagueTeams(league: LeagueConfig, season: number) {
  try {
    const seasonsToTry = [season, ...FALLBACK_SEASONS];
    let selectedSeason = season;
    let teams: TeamEntry[] = [];

    for (const candidateSeason of seasonsToTry) {
      const candidateTeams = await fetchTeams(league.id, candidateSeason);
      if (candidateTeams.length > 0) {
        selectedSeason = candidateSeason;
        teams = candidateTeams;
        break;
      }
    }

    const uniqueTeams = Array.from(new Map(teams.map((team) => [team.id, team])).values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const filePath = path.join(OUTPUT_DIR, league.file);

    await fs.writeFile(filePath, JSON.stringify(uniqueTeams, null, 2), "utf-8");
    if (uniqueTeams.length === 0) {
      console.log(`Saved 0 teams for ${league.label}. No data found for seasons ${seasonsToTry.join(", ")} at ${filePath}.`);
      return;
    }

    if (selectedSeason === season) {
      console.log(`Saved ${uniqueTeams.length} teams for ${league.label} (${season}) to ${filePath}.`);
      return;
    }

    console.log(
      `Saved ${uniqueTeams.length} teams for ${league.label} using fallback season ${selectedSeason} (requested ${season}) to ${filePath}.`
    );
  } catch (error) {
    console.error(`Error fetching ${league.label} (${season}):`, error);
  }
}

seedTeams().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
