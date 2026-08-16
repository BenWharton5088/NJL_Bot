import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

let client;
const cache = new Map();

function getClient() {
  if (!client) {
    const vaultUrl = process.env.KEY_VAULT_URL;
    if (!vaultUrl) throw new Error("Missing required setting: KEY_VAULT_URL");
    client = new SecretClient(vaultUrl, new DefaultAzureCredential());
  }
  return client;
}

export async function getSecret(name) {
  if (cache.has(name)) return cache.get(name);
  const secret = await getClient().getSecret(name);
  if (!secret.value) throw new Error(`Key Vault secret ${name} has no value`);
  cache.set(name, secret.value);
  return secret.value;
}
