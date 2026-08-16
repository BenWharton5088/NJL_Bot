export const guildCommands = [
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
