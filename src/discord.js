const API_BASE = "https://discord.com/api/v10";

async function discordRequest(path, token, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Discord ${response.status} ${path}: ${detail}`);
  }

  if (response.status === 204) return null;
  return response.json();
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
