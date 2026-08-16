import {
  addMemberRole,
  getGuildMember,
  getGuildRoles,
  removeMemberRole,
} from "./discord.js";
import { getLeagueStandings } from "./sleeper.js";

export const COSMETIC_ROLE_NAMES = [
  "Try Hard",
  "Average",
  "Last Place",
  "Playoffs",
  "Washed",
];

export function desiredRoleNames(rank, totalTeams, playoffTeams) {
  const standingRole = rank === 1
    ? "Try Hard"
    : rank === totalTeams
      ? "Last Place"
      : "Average";
  const playoffRole = rank <= playoffTeams ? "Playoffs" : "Washed";
  return [standingRole, playoffRole];
}

export async function syncStandingsRoles({ guildId, leagueId, userMap, token, log }) {
  const [{ standings, playoffTeams }, guildRoles] = await Promise.all([
    getLeagueStandings(leagueId),
    getGuildRoles(guildId, token),
  ]);

  const rolesByName = new Map(guildRoles.map((role) => [role.name, role.id]));
  const missingRoles = COSMETIC_ROLE_NAMES.filter((name) => !rolesByName.has(name));
  if (missingRoles.length) {
    throw new Error(`Missing Discord cosmetic roles: ${missingRoles.join(", ")}`);
  }

  const cosmeticRoleIds = new Set(COSMETIC_ROLE_NAMES.map((name) => rolesByName.get(name)));
  const results = [];

  for (let index = 0; index < standings.length; index += 1) {
    const roster = standings[index];
    const rank = index + 1;
    const discordUserId = userMap[roster.owner_id];

    if (!discordUserId) {
      results.push({ sleeperUserId: roster.owner_id, rank, status: "missing-user-map" });
      continue;
    }

    const desiredNames = desiredRoleNames(rank, standings.length, playoffTeams);
    const desiredIds = new Set(desiredNames.map((name) => rolesByName.get(name)));
    const member = await getGuildMember(guildId, discordUserId, token);
    const currentCosmeticIds = member.roles.filter((roleId) => cosmeticRoleIds.has(roleId));

    for (const roleId of currentCosmeticIds) {
      if (!desiredIds.has(roleId)) {
        await removeMemberRole(guildId, discordUserId, roleId, token);
      }
    }

    for (const roleId of desiredIds) {
      if (!member.roles.includes(roleId)) {
        await addMemberRole(guildId, discordUserId, roleId, token);
      }
    }

    results.push({ discordUserId, rank, roles: desiredNames, status: "synced" });
  }

  log?.(`Role sync completed for ${results.length} Sleeper rosters.`);
  return results;
}
