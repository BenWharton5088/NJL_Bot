import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { registerGuildCommands } from "../src/commands.js";

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required setting: ${name}`);
  return value;
};

const vaultUrl = required("KEY_VAULT_URL");
const secretClient = new SecretClient(vaultUrl, new DefaultAzureCredential());
const token = (await secretClient.getSecret("discord-bot-token")).value;
const applicationId = required("DISCORD_APPLICATION_ID");
const guildId = required("DISCORD_GUILD_ID");

const commands = await registerGuildCommands({ applicationId, guildId, token });
console.log(`Registered ${commands.length} guild commands.`);
