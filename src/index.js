import { app } from "@azure/functions";
import { getInteractionConfig, getRoleSyncConfig } from "./config.js";
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
  route: "admin/sync-roles",
  handler: async (_request, context) => {
    const results = await runRoleSync(context);
    return { status: 200, jsonBody: { results } };
  },
});
