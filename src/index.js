import { app } from "@azure/functions";
import { registerGuildCommands } from "./commands.js";
import { getDiscordConfig, getInteractionConfig, getRoleSyncConfig } from "./config.js";
import { handleInteraction, verifyDiscordRequest } from "./interactions.js";
import { syncStandingsRoles } from "./role-sync.js";
import { getSecret } from "./secrets.js";

app.http("discordInteractions", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "discord/interactions",
  handler: async (request, context) => {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature-ed25519");
    const timestamp = request.headers.get("x-signature-timestamp");
    const { publicKey } = getInteractionConfig();

    if (!verifyDiscordRequest({ publicKey, signature, timestamp, rawBody })) {
      return { status: 401, jsonBody: { error: "Invalid request signature" } };
    }

    const response = handleInteraction(JSON.parse(rawBody));
    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response),
    };
  },
});

async function runRoleSync(context) {
  context.log("Role sync: loading configuration.");
  const config = getRoleSyncConfig();
  context.log(`Role sync: configuration loaded for league ${config.leagueId}, guild ${config.guildId}, and ${Object.keys(config.userMap).length} mapped users.`);
  context.log("Role sync: loading the Discord bot token from Key Vault.");
  const token = await getSecret("discord-bot-token");
  context.log("Role sync: token loaded; fetching Sleeper standings and Discord roles.");
  const results = await syncStandingsRoles({ ...config, token, log: context.log.bind(context) });
  const counts = results.reduce((summary, result) => {
    summary[result.status] = (summary[result.status] || 0) + 1;
    return summary;
  }, {});
  context.log(`Role sync: completed with status counts ${JSON.stringify(counts)}.`);
  return results;
}

app.timer("weeklyRoleSync", {
  schedule: "0 0 10 * * 2",
  handler: async (_timer, context) => {
    await runRoleSync(context);
  },
});

app.http("manualRoleSync", {
  methods: ["POST"],
  authLevel: "function",
  route: "bot/sync-roles",
  handler: async (_request, context) => {
    try {
      const results = await runRoleSync(context);
      return { status: 200, jsonBody: { results } };
    } catch (error) {
      context.error(`Role sync failed: ${error.message}`);
      context.error(error.stack || String(error));
      return {
        status: 500,
        jsonBody: {
          error: error.message,
          code: error.code || null,
          statusCode: error.statusCode || null,
        },
      };
    }
  },
});

app.http("registerCommands", {
  methods: ["POST"],
  authLevel: "function",
  route: "bot/register-commands",
  handler: async (_request, context) => {
    try {
      const token = await getSecret("discord-bot-token");
      const commands = await registerGuildCommands({ ...getDiscordConfig(), token });
      context.log(`Registered ${commands.length} Discord guild commands.`);
      return { status: 200, jsonBody: { commands } };
    } catch (error) {
      context.error(`Command registration failed: ${error.message}`);
      return {
        status: 500,
        jsonBody: {
          error: error.message,
          code: error.code || null,
          statusCode: error.statusCode || null,
        },
      };
    }
  },
});

app.timer("registerCommandsOnStartup", {
  schedule: "0 0 3 1 * *",
  runOnStartup: true,
  handler: async (_timer, context) => {
    const token = await getSecret("discord-bot-token");
    const commands = await registerGuildCommands({ ...getDiscordConfig(), token });
    context.log(`Registered ${commands.length} Discord guild commands on startup.`);
  },
});
