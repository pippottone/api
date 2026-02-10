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

const ALIAS_MAP: Record<string, string> = {
  INTER: "Inter",
  INTERNAZIONALE: "Inter",
  "INTERNAZIONALE MILANO": "Inter",
  JUVE: "Juventus",
  SPURS: "Tottenham Hotspur",
  WOLVES: "Wolverhampton Wanderers"
};

function normalizeStrict(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeName(value: string): string {
  const tokens = value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((token) => token && !NORMALIZE_REMOVE_TOKENS.has(token));

  return tokens.join(" ").trim();
}

export { ALIAS_MAP, normalizeName, normalizeStrict, NORMALIZE_REMOVE_TOKENS };
