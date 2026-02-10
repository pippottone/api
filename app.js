const NORMALIZE_REMOVE_TOKENS = new Set([
  "FC",
  "AC",
  "AS",
  "SSC",
  "CF",
  "SC",
  "OLYMPIQUE",
  "1",
  "1899",
  "09",
  "04"
]);

const ALIAS_MAP = {
  INTER: "Inter",
  INTERNAZIONALE: "Inter",
  "INTERNAZIONALE MILANO": "Inter",
  JUVE: "Juventus",
  SPURS: "Tottenham Hotspur",
  WOLVES: "Wolverhampton Wanderers"
};

const inputEl = document.getElementById("teamInput");
const outputEl = document.getElementById("outputValue");
const lookupButton = document.getElementById("lookupButton");
const entryCountEl = document.getElementById("entryCount");
const teamCountEl = document.getElementById("teamCount");

let dictionary = {};
let teamSet = new Set();

function normalizeName(value) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((token) => token && !NORMALIZE_REMOVE_TOKENS.has(token))
    .join(" ")
    .trim();
}

function setOutput(message, tone) {
  outputEl.textContent = message;
  outputEl.style.color = tone === "error" ? "#f87171" : "#f8f7ff";
}

function lookupTeam(rawInput) {
  if (!rawInput || !rawInput.trim()) {
    setOutput("Type a team name first.", "error");
    return;
  }

  const normalizedInput = normalizeName(rawInput);
  const aliasTarget = ALIAS_MAP[normalizedInput];
  let entry = dictionary[normalizedInput];
  if (!entry && aliasTarget) {
    entry = dictionary[normalizeName(aliasTarget)];
  }

  if (!entry) {
    setOutput(`No exact match for "${rawInput}"`, "error");
    return;
  }

  setOutput(`${entry.name} (id ${entry.id})`);
}

async function loadDictionary() {
  try {
    const response = await fetch("./src/data/teams_dictionary.json");
    dictionary = await response.json();

    const entries = Object.values(dictionary);
    entryCountEl.textContent = entries.length.toString();
    teamSet = new Set(entries.map((entry) => entry.name));
    teamCountEl.textContent = teamSet.size.toString();
  } catch (error) {
    setOutput("Failed to load dictionary. Run the seed script first.", "error");
  }
}

lookupButton.addEventListener("click", () => lookupTeam(inputEl.value));
inputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    lookupTeam(inputEl.value);
  }
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const value = chip.getAttribute("data-value") || "";
    inputEl.value = value;
    lookupTeam(value);
  });
});

loadDictionary();
