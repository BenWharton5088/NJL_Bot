import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, stat, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const api = 'https://api.sleeper.app/v1';
const leagueId = '1391910860976328704';
const placeholder = 'https://sleepercdn.com/images/v2/icons/player_default.webp';
const root = path.resolve(import.meta.dirname, '..');
const recordPath = path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'automations', 'post-weekly-sleeper-scores', 'idempotency.json');
async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Sleeper HTTP ${response.status}`);
  return response.json();
}
const state = await json(`${api}/state/nfl`);
if (state.season_type !== 'regular' || !Number.isInteger(Number(state.week)) || Number(state.week) <= 1) {
  console.log(JSON.stringify({ status: 'skipped', reason: 'no-completed-regular-week' }));
  process.exit(0);
}
const week = Number(state.week) - 1;
const season = String(state.season);
const [league, users, rosters, entries] = await Promise.all([
  json(`${api}/league/${leagueId}`), json(`${api}/league/${leagueId}/users`),
  json(`${api}/league/${leagueId}/rosters`), json(`${api}/league/${leagueId}/matchups/${week}`),
]);
if (String(league.season) !== season) throw new Error('League season differs from NFL state');
const usersById = new Map(users.map(user => [user.user_id, user]));
const teamsByRoster = new Map(rosters.map(roster => {
  const user = usersById.get(roster.owner_id);
  const avatar = user?.avatar;
  return [roster.roster_id, {
    rosterId: roster.roster_id,
    name: roster.metadata?.team_name || user?.metadata?.team_name || user?.display_name || `Roster ${roster.roster_id}`,
    avatar: avatar ? (/^https?:\/\//i.test(avatar) ? avatar : `https://sleepercdn.com/avatars/thumbs/${avatar}`) : placeholder,
  }];
}));
const groups = new Map();
for (const entry of entries) {
  const base = teamsByRoster.get(entry.roster_id);
  const score = Number(entry.points);
  if (!base || !Number.isFinite(score) || !Number.isInteger(Number(entry.matchup_id))) throw new Error('Incomplete matchup entry');
  const teams = groups.get(entry.matchup_id) || [];
  teams.push({ ...base, score });
  groups.set(entry.matchup_id, teams);
}
const games = [...groups].sort((a, b) => Number(a[0]) - Number(b[0])).map(([id, teams]) => {
  if (teams.length !== 2) throw new Error(`Matchup ${id} does not have two teams`);
  teams.sort((a, b) => a.rosterId - b.rosterId);
  const [a, b] = teams;
  return { id, teams, tie: a.score === b.score, margin: Math.abs(a.score - b.score), loser: a.score === b.score ? null : a.score < b.score ? a : b };
});
if (games.length !== 5 || entries.length !== 10) throw new Error('Expected five complete matchups');
const all = games.flatMap(game => game.teams);
const highest = [...all].sort((a, b) => b.score - a.score || a.rosterId - b.rosterId)[0];
const lowest = [...all].sort((a, b) => a.score - b.score || a.rosterId - b.rosterId)[0];
const belted = games.filter(game => game.loser).sort((a, b) => b.margin - a.margin || Number(a.id) - Number(b.id))[0]?.loser;
if (!belted) throw new Error('No BELTED team available');
const input = {
  season, week,
  matchups: games.map(game => [game.teams[0].name, game.teams[0].score.toFixed(2), game.teams[0].avatar, game.teams[1].name, game.teams[1].score.toFixed(2), game.teams[1].avatar]),
  awards: { tryHard: highest.name, lowestScore: lowest.name, belted: belted.name },
};
const hash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
const key = `${season}:${week}:${hash}`;
let record = {};
try { record = JSON.parse(await readFile(recordPath, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (record[key]) {
  console.log(JSON.stringify({ status: 'already-posted', season, week, resultsHash: hash }));
  process.exit(0);
}
const webhook = process.env.News_Webhook;
if (!webhook) {
  console.log(JSON.stringify({ status: 'skipped', reason: 'missing-News_Webhook', season, week }));
  process.exit(0);
}
const work = await mkdtemp(path.join(os.tmpdir(), 'njl-scoreboard-'));
try {
  const png = path.join(work, 'scoreboard.png');
  const config = path.join(work, 'input.json');
  await writeFile(config, JSON.stringify({ ...input, output: png }));
  await exec(process.execPath, [path.join(root, 'scripts', 'render-scoreboard.cjs'), config]);
  if ((await stat(png)).size <= 0) throw new Error('Rendered PNG is empty');
  const filename = `njl-week-${week}-scoreboard.png`;
  const form = new FormData();
  form.append('payload_json', JSON.stringify({ allowed_mentions: { parse: [] } }));
  form.append('files[0]', new Blob([await readFile(png)], { type: 'image/png' }), filename);
  const url = new URL(webhook);
  url.searchParams.set('wait', 'true');
  const response = await fetch(url, { method: 'POST', body: form });
  if (!response.ok) throw new Error(`Discord HTTP ${response.status}`);
  const message = await response.json();
  if (!/^\d+$/.test(String(message.id || ''))) throw new Error('Discord did not return a message id');
  record[key] = { season, week, resultsHash: hash, messageId: message.id, postedAt: new Date().toISOString() };
  await mkdir(path.dirname(recordPath), { recursive: true });
  await writeFile(recordPath, JSON.stringify(record, null, 2));
  console.log(JSON.stringify({ status: 'posted', season, week, resultsHash: hash, messageId: message.id, attachments: 1 }));
} finally {
  await rm(work, { recursive: true, force: true });
}
