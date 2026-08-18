export const guildCommands = [
  {
    name: "sportsmanship",
    description: "Be nice to somebody.",
    options: [{ type: 6, name: "person", description: "Member to compliment", required: true }],
  },
  {
    name: "unsportsmanlike",
    description: ">=(",
    options: [{ type: 6, name: "person", description: "Member to be mean to", required: true }],
  },
];

export async function registerGuildCommands({ applicationId, guildId, token }) {
  const response = await fetch(
    `https://discord.com/api/v10/applications/${applicationId}/guilds/${guildId}/commands`,
    {
      method: "PUT",
      headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(guildCommands),
    },
  );

  if (!response.ok) throw new Error(`Discord ${response.status}: ${await response.text()}`);
  return response.json();
}
