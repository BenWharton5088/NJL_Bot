# National Josh League Bot

Azure Functions app for the National Josh League Discord server.

## Features

- Verifies Discord interaction signatures.
- Provides `/sportsmanship person` and `/unsportsmanlike person` commands.
- Registers both commands automatically when the Function App starts.
- Synchronizes `Try Hard`, `Average`, `Last Place`, `Playoffs`, and `Washed` roles every Tuesday at 10:00 AM Central time.
- Reads the Discord bot token from Azure Key Vault through managed identity.

## Required Function App settings

- `KEY_VAULT_URL=https://kv-national-josh-bot.vault.azure.net/`
- `DISCORD_APPLICATION_ID`
- `DISCORD_PUBLIC_KEY`
- `DISCORD_GUILD_ID`
- `SLEEPER_LEAGUE_ID=1391910860976328704`
- `SLEEPER_DISCORD_USER_MAP` as JSON mapping Sleeper owner IDs to Discord user IDs
- `WEBSITE_TIME_ZONE=Central Standard Time`

The Key Vault must contain `discord-bot-token`; `discord-webhook-url` remains available for webhook automations but is not required by this Function App.

## Discord requirements

The bot needs **Manage Roles**, and its bot role must be above all five cosmetic roles but below Admin and Commissioner.

## Routes

- `POST /api/discord/interactions` — Discord Interactions Endpoint URL.
- `POST /api/admin/sync-roles` — manual role sync protected by a Function key.
- `POST /api/admin/register-commands` — registers both guild commands and is protected by a Function key.
