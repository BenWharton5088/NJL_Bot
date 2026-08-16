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

    return { status: 200, jsonBody: handleInteraction(JSON.parse(rawBody)) };
  },
});

async function runRoleSync(context) {
  const config = getRoleSyncConfig();
  const token = await getSecret("discord-bot-token");
  return syncStandingsRoles({ ...config, token, log: context.log.bind(context) });
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
    const results = await runRoleSync(context);
    return { status: 200, jsonBody: { results } };
  },
});

app.http("registerCommands", {
  methods: ["POST"],
  authLevel: "anonymous",
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
