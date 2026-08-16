const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required setting: ${name}`);
  return value;
};

export function getRoleSyncConfig() {
  let userMap;
  try {
    userMap = JSON.parse(required("SLEEPER_DISCORD_USER_MAP"));
  } catch (error) {
    throw new Error(`SLEEPER_DISCORD_USER_MAP must be valid JSON: ${error.message}`);
  }

  return {
    guildId: required("DISCORD_GUILD_ID"),
    leagueId: process.env.SLEEPER_LEAGUE_ID || "1391910860976328704",
    userMap,
  };
}

export function getInteractionConfig() {
  return {
    publicKey: required("DISCORD_PUBLIC_KEY"),
  };
}

export function getDiscordConfig() {
  return {
    applicationId: required("DISCORD_APPLICATION_ID"),
    guildId: required("DISCORD_GUILD_ID"),
  };
}
