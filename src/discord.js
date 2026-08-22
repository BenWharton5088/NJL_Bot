const API_BASE = "https://discord.com/api/v10";
const MAX_RATE_LIMIT_RETRIES = 5;
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function discordRequest(path, token, options = {}) {
  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (response.status === 429) {
      const detail = await response.text();
      let retryAfterSeconds = Number(response.headers.get("retry-after"));
      try {
        const body = JSON.parse(detail);
        retryAfterSeconds = Number(body.retry_after ?? retryAfterSeconds);
      } catch {
        // Use the Retry-After header when Discord does not return JSON.
      }

      if (attempt === MAX_RATE_LIMIT_RETRIES) {
        throw new Error(`Discord rate limit persisted after ${MAX_RATE_LIMIT_RETRIES} retries for ${path}`);
      }

      const waitMilliseconds = Math.max(50, Math.ceil((retryAfterSeconds || 1) * 1000));
      await sleep(waitMilliseconds);
      continue;
    }

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Discord ${response.status} ${path}: ${detail}`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  throw new Error(`Discord request retry loop ended unexpectedly for ${path}`);
}

export const getGuildRoles = (guildId, token) =>
  discordRequest(`/guilds/${guildId}/roles`, token);

export const getGuildMember = (guildId, userId, token) =>
  discordRequest(`/guilds/${guildId}/members/${userId}`, token);

export const addMemberRole = (guildId, userId, roleId, token) =>
  discordRequest(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, token, {
    method: "PUT",
  });

export const removeMemberRole = (guildId, userId, roleId, token) =>
  discordRequest(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, token, {
    method: "DELETE",
  });
