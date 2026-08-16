import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required setting: ${name}`);
  return value;
};

const commands = [
  {
    name: "sportsmanship",
    description: "Give a league member an aggressively cringe compliment",
    options: [{ type: 6, name: "person", description: "Member to compliment", required: true }],
  },
  {
    name: "unsportsmanlike",
    description: "Give a league member a fantasy-football violation",
    options: [{ type: 6, name: "person", description: "Member to roast", required: true }],
  },
];

const vaultUrl = required("KEY_VAULT_URL");
const secretClient = new SecretClient(vaultUrl, new DefaultAzureCredential());
const token = (await secretClient.getSecret("discord-bot-token")).value;
const applicationId = required("DISCORD_APPLICATION_ID");
const guildId = required("DISCORD_GUILD_ID");

const response = await fetch(
  `https://discord.com/api/v10/applications/${applicationId}/guilds/${guildId}/commands`,
  {
    method: "PUT",
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  },
);

if (!response.ok) throw new Error(`Discord ${response.status}: ${await response.text()}`);
console.log(`Registered ${(await response.json()).length} guild commands.`);
