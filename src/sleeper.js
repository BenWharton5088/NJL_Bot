const API_BASE = "https://api.sleeper.app/v1";

async function sleeperGet(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`Sleeper ${response.status} ${path}`);
  return response.json();
}

function pointsFor(settings) {
  return Number(settings.fpts || 0) + Number(settings.fpts_decimal || 0) / 100;
}

export async function getLeagueStandings(leagueId) {
  const [league, rosters] = await Promise.all([
    sleeperGet(`/league/${leagueId}`),
    sleeperGet(`/league/${leagueId}/rosters`),
  ]);

  const standings = rosters
    .filter((roster) => roster.owner_id)
    .sort((a, b) => {
      const winDifference = Number(b.settings.wins || 0) - Number(a.settings.wins || 0);
      if (winDifference) return winDifference;
      return pointsFor(b.settings) - pointsFor(a.settings);
    });

  return {
    playoffTeams: Number(league.settings?.playoff_teams || 6),
    standings,
  };
}
