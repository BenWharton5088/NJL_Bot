import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const API = "https://api.sleeper.app/v1";
const LEAGUE_ID = process.env.SLEEPER_LEAGUE_ID || "1391910860976328704";
const PRODUCTION = process.argv.includes("--production");
const SCOREBOARD_ONLY = process.argv.includes("--scoreboard-only");
const STANDINGS_ONLY = process.argv.includes("--standings-only");
if (SCOREBOARD_ONLY && STANDINGS_ONLY) throw new Error("Choose only one image mode");
const WEBHOOK = PRODUCTION ? process.env.News_Webhook : (process.env.Dev_Webhook || process.env.DEV_WEBHOOK_URL);
const PLACEHOLDER = "https://sleepercdn.com/images/v2/icons/player_default.webp";
const ROOT = path.resolve(import.meta.dirname, "..");

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed with HTTP ${response.status}`);
  return response.json();
}

function avatarUrl(value) {
  if (!value) return PLACEHOLDER;
  return /^https?:\/\//i.test(value) ? value : `https://sleepercdn.com/avatars/thumbs/${value}`;
}

function teamFor(roster, usersById) {
  const user = usersById.get(roster.owner_id);
  return {
    rosterId: roster.roster_id,
    name: roster.metadata?.team_name || user?.metadata?.team_name || user?.display_name || `Roster ${roster.roster_id}`,
    avatar: avatarUrl(user?.avatar),
  };
}

async function postImage(webhook, imagePath, filename) {
  const form = new FormData();
  form.append("payload_json", JSON.stringify({ allowed_mentions: { parse: [] }, attachments: [{ id: 0, filename }] }));
  form.append("files[0]", new Blob([await readFile(imagePath)], { type: "image/png" }), filename);
  const url = new URL(webhook);
  url.searchParams.set("wait", "true");
  const response = await fetch(url, { method: "POST", body: form });
  if (!response.ok) throw new Error(`Dev webhook rejected ${filename} with HTTP ${response.status}`);
  const result = await response.json();
  if (!result.id) throw new Error(`Dev webhook did not confirm ${filename}`);
}

async function main() {
  const state = await getJson(`${API}/state/nfl`);
  if (state.season_type !== "regular" || Number(state.week) <= 1) throw new Error("No completed regular-season week is available");
  const week = Number(state.week) - 1;
  const [league, users, rosters, entries] = await Promise.all([
    getJson(`${API}/league/${LEAGUE_ID}`),
    getJson(`${API}/league/${LEAGUE_ID}/users`),
    getJson(`${API}/league/${LEAGUE_ID}/rosters`),
    getJson(`${API}/league/${LEAGUE_ID}/matchups/${week}`),
  ]);
  const usersById = new Map(users.map((user) => [user.user_id, user]));
  const teamsByRoster = new Map(rosters.map((roster) => [roster.roster_id, teamFor(roster, usersById)]));
  const groups = new Map();
  for (const entry of entries) {
    const team = { ...teamsByRoster.get(entry.roster_id), score: Number(entry.points) };
    const group = groups.get(entry.matchup_id) || [];
    group.push(team);
    groups.set(entry.matchup_id, group);
  }
  const games = [...groups.entries()].sort((a, b) => Number(a[0]) - Number(b[0])).map(([id, teams]) => {
    if (teams.length !== 2 || teams.some((team) => !Number.isFinite(team.score))) throw new Error(`Matchup ${id} is incomplete`);
    teams.sort((a, b) => a.rosterId - b.rosterId);
    const [a, b] = teams;
    return { id, teams, margin: Math.abs(a.score - b.score), loser: a.score === b.score ? null : (a.score < b.score ? a : b) };
  });
  if (games.length !== 5) throw new Error(`Expected five matchups, received ${games.length}`);
  const scoredTeams = games.flatMap((game) => game.teams);
  const highest = [...scoredTeams].sort((a, b) => b.score - a.score || a.rosterId - b.rosterId)[0];
  const lowest = [...scoredTeams].sort((a, b) => a.score - b.score || a.rosterId - b.rosterId)[0];
  const belted = [...games].filter((game) => game.loser).sort((a, b) => b.margin - a.margin || Number(a.id) - Number(b.id))[0]?.loser;
  if (!belted) throw new Error("No losing team is available for BELTED");

  const standings = rosters.map((roster) => {
    const team = teamsByRoster.get(roster.roster_id);
    const wins = Number(roster.settings?.wins || 0);
    const losses = Number(roster.settings?.losses || 0);
    const ties = Number(roster.settings?.ties || 0);
    const points = Number(roster.settings?.fpts || 0) + Number(roster.settings?.fpts_decimal || 0) / 100;
    return { ...team, wins, losses, ties, points };
  }).sort((a, b) => b.wins - a.wins || b.points - a.points || a.rosterId - b.rosterId);

  const work = await mkdtemp(path.join(tmpdir(), "njl-weekly-"));
  try {
    const scoreboardPath = path.join(ROOT, "artifacts", `week-${week}-scoreboard.png`);
    const standingsPath = path.join(ROOT, "artifacts", `week-${week}-standings.png`);
    const scoreboardConfig = path.join(work, "scoreboard.json");
    const standingsConfig = path.join(work, "standings.json");
    await writeFile(scoreboardConfig, JSON.stringify({
      week,
      season: league.season,
      output: scoreboardPath,
      matchups: games.map((game) => [game.teams[0].name, game.teams[0].score.toFixed(2), game.teams[0].avatar, game.teams[1].name, game.teams[1].score.toFixed(2), game.teams[1].avatar]),
      awards: { tryHard: highest.name, lowestScore: lowest.name, belted: belted.name },
    }));
    await writeFile(standingsConfig, JSON.stringify({
      week,
      season: league.season,
      playoffTeams: Number(league.settings?.playoff_teams || 6),
      output: standingsPath,
      teams: standings.map((team) => [team.name, `${team.wins}-${team.losses}${team.ties ? `-${team.ties}` : ""}`, team.points.toFixed(2), team.avatar]),
    }));
    await execFileAsync(process.execPath, [path.join(ROOT, "scripts", "render-scoreboard.cjs"), scoreboardConfig]);
    await execFileAsync(process.execPath, [path.join(ROOT, "scripts", "render-standings.cjs"), standingsConfig]);

    if (!WEBHOOK) {
      console.log(JSON.stringify({ status: "rendered", week, scoreboardPath, standingsPath, posted: false, reason: PRODUCTION ? "missing-production-webhook" : "missing-dev-webhook" }));
      return;
    }
    if (!PRODUCTION && process.env.News_Webhook && WEBHOOK === process.env.News_Webhook) throw new Error("Dev webhook matches the production webhook; refusing test post");
    let images = 0;
    if (!STANDINGS_ONLY) {
      await postImage(WEBHOOK, scoreboardPath, `week-${week}-scoreboard.png`);
      images += 1;
    }
    if (!SCOREBOARD_ONLY) {
      await postImage(WEBHOOK, standingsPath, `week-${week}-standings.png`);
      images += 1;
    }
    console.log(JSON.stringify({ status: PRODUCTION ? "posted-to-production" : "posted-to-dev", week, images }));
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "failed", error: error.message }));
  process.exitCode = 1;
});
