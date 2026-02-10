// fetchTeams.js
const axios = require('axios');
const fs = require('fs');

const API_KEY = '4fa236b433cbbc571edc0c2dc4b4b67e';
const SEASON = 2023; // Current season

// The IDs for the leagues you support (e.g., 39=Premier League, 135=Serie A, 140=La Liga, 78=Bundesliga, 61=Ligue 1)
const LEAGUE_IDS = [39, 135, 140, 78, 61]; 

async function getAllTeams() {
  let allTeams = [];

  console.log("Fetching teams...");

  for (const leagueId of LEAGUE_IDS) {
    try {
      const response = await axios.get('https://v3.football.api-sports.io/teams', {
        headers: { 'x-apisports-key': API_KEY },
        params: { league: leagueId, season: SEASON }
      });
      
      const teams = response.data.response.map(item => ({
        id: item.team.id,
        name: item.team.name,      // e.g., "Manchester United"
        code: item.team.code,      // e.g., "MUN"
        country: item.team.country
      }));

      allTeams = [...allTeams, ...teams];
      console.log(`Fetched ${teams.length} teams from league ${leagueId}`);
      
    } catch (error) {
      console.error(`Error fetching league ${leagueId}:`, error);
    }
  }

  // Write to a JSON file
  fs.writeFileSync('teams_db.json', JSON.stringify(allTeams, null, 2));
  console.log(`Saved ${allTeams.length} teams to teams_db.json`);
}

getAllTeams();


import Fuse from 'fuse.js';
import teamsData from './teams_db.json'; // The file you generated above

// 1. Setup Fuse options
const fuseOptions = {
  includeScore: true,
  threshold: 0.3, // 0.0 = perfect match, 1.0 = match anything. 0.3 is usually good for typos.
  keys: ['name', 'code'] // Search in both the Full Name and the Short Code
};

// 2. Initialize the index
const fuse = new Fuse(teamsData, fuseOptions);

// 3. The function to find a team
function findTeamID(userInput: string) {
  const result = fuse.search(userInput);

  if (result.length > 0) {
    // Return the best match
    const bestMatch = result[0].item;
    return {
      matched: true,
      teamId: bestMatch.id,
      officialName: bestMatch.name,
      score: result[0].score // Lower is better
    };
  } else {
    return { matched: false };
  }
}

// --- EXAMPLES ---
console.log(findTeamID("Man U"));       // Matches "Manchester United" (via fuzzy logic)
console.log(findTeamID("Juve"));        // Matches "Juventus"
console.log(findTeamID("Barca"));       // Matches "Barcelona"
console.log(findTeamID("Liverpool FC")); // Matches "Liverpool"


