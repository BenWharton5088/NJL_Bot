import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const api = 'https://api.sleeper.app/v1';
const leagueId = '1391910860976328704';
const placeholder = 'https://sleepercdn.com/images/v2/icons/player_default.webp';
const recordPath = path.join(process.env.CODEX_HOME || path.join(homedir(), '.codex'), 'automations', 'post-weekly-sleeper-standings', 'idempotency.json');
const renderer = path.join(import.meta.dirname, 'render-standings.cjs');

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Sleeper returned HTTP ${response.status}`);
  return response.json();
}

function avatar(value) {
  if (!value) return placeholder;
  return /^https?:\/\//i.test(value) ? value : `https://sleepercdn.com/avatars/thumbs/${value}`;
}

function points(settings) {
  return Number(settings?.fpts || 0) + Number(settings?.fpts_decimal || 0) / 100;
}

async function main() {
  const state = await getJson(`${api}/state/nfl`);
  if (state.season_type !== 'regular' || Number(state.week) <= 1) {
    console.log(JSON.stringify({ status: 'skipped', reason: 'no_completed_regular_week' }));
    return;
  }
  const week = Number(state.week) - 1;
  const [league, users, rosters] = await Promise.all([
    getJson(`${api}/league/${leagueId}`),
    getJson(`${api}/league/${leagueId}/users`),
    getJson(`${api}/league/${leagueId}/rosters`),
  ]);
  if (String(league.season) !== String(state.season)) throw new Error('League season differs from NFL state');
  const usersById = new Map(users.map(user => [user.user_id, user]));
  const teams = rosters.map(roster => {
    const user = usersById.get(roster.owner_id);
    if (!user) throw new Error(`No user for roster ${roster.roster_id}`);
    const settings = roster.settings || {};
    return {
      rosterId: Number(roster.roster_id),
      name: roster.metadata?.team_name || user.metadata?.team_name || user.display_name || `Roster ${roster.roster_id}`,
      avatar: avatar(user.avatar),
      wins: Number(settings.wins || 0),
      losses: Number(settings.losses || 0),
      ties: Number(settings.ties || 0),
      points: points(settings),
    };
  });
  const seedType = Number(league.settings?.playoff_seed_type || 0);
  if (![0, 1].includes(seedType)) throw new Error(`Unsupported playoff seed type ${seedType}`);
  teams.sort((a, b) => seedType === 1
    ? b.points - a.points || b.wins - a.wins || a.rosterId - b.rosterId
    : b.wins - a.wins || b.points - a.points || a.rosterId - b.rosterId);
  const hashSource = teams.map(t => `${t.rosterId}:${t.wins}:${t.losses}:${t.ties}:${t.points.toFixed(2)}`).join('|');
  const hash = createHash('sha256').update(hashSource).digest('hex');
  const key = `${state.season}|${week}|${hash}`;
  let record = {};
  try { record = JSON.parse(await readFile(recordPath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (record[key]) {
    console.log(JSON.stringify({ status: 'skipped', reason: 'already_posted', season: state.season, week }));
    return;
  }
  const webhook = process.env.News_Webhook;
  if (!webhook) {
    console.log(JSON.stringify({ status: 'skipped', reason: 'missing_News_Webhook', season: state.season, week }));
    return;
  }
  const work = await mkdtemp(path.join(tmpdir(), 'njl-standings-'));
  try {
    const inputPath = path.join(work, 'input.json');
    const outputPath = path.join(work, 'standings.png');
    await writeFile(inputPath, JSON.stringify({
      season: league.season,
      week,
      playoffTeams: Number(league.settings.playoff_teams),
      output: outputPath,
      teams: teams.map(t => [t.name, `${t.wins}-${t.losses}${t.ties ? `-${t.ties}` : ''}`, t.points.toFixed(2), t.avatar]),
    }));
    await run(process.execPath, [renderer, inputPath]);
    const file = await stat(outputPath);
    if (!file.isFile() || !file.size) throw new Error('Rendered PNG is empty');
    const filename = `njl-standings-${state.season}-week-${week}.png`;
    const form = new FormData();
    form.append('payload_json', JSON.stringify({ allowed_mentions: { parse: [] }, attachments: [{ id: 0, filename }] }));
    form.append('files[0]', new Blob([await readFile(outputPath)], { type: 'image/png' }), filename);
    const url = new URL(webhook);
    url.searchParams.set('wait', 'true');
    const response = await fetch(url, { method: 'POST', body: form });
    if (!response.ok) throw new Error(`Discord returned HTTP ${response.status}`);
    const accepted = await response.json();
    if (!accepted.id) throw new Error('Discord returned no message id');
    record[key] = { acceptedAt: new Date().toISOString(), season: String(state.season), week, standingsHash: hash, messageId: String(accepted.id) };
    await writeFile(recordPath, JSON.stringify(record, null, 2) + '\n');
    console.log(JSON.stringify({ status: 'posted', season: state.season, week, teams: teams.length, discordAccepted: true }));
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(JSON.stringify({ status: 'failed', reason: /Discord|Rendered|Sleeper|League|roster|seed/i.test(error.message) ? error.message : 'standings_post_failed' }));
  process.exitCode = 1;
});
