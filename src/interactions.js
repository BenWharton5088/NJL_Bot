import nacl from "tweetnacl";
import { sportsmanshipMessage, unsportsmanlikeMessage } from "./messages.js";

const encoder = new TextEncoder();

export function verifyDiscordRequest({ publicKey, signature, timestamp, rawBody }) {
  if (!signature || !timestamp) return false;
  return nacl.sign.detached.verify(
    encoder.encode(timestamp + rawBody),
    Buffer.from(signature, "hex"),
    Buffer.from(publicKey, "hex"),
  );
}

function selectedUserId(interaction) {
  return interaction.data?.options?.find((option) => option.name === "person")?.value;
}

export function handleInteraction(interaction) {
  if (interaction.type === 1) return { type: 1 };

  if (interaction.type !== 2) {
    return { type: 4, data: { content: "Unsupported interaction.", flags: 64 } };
  }

  const senderId = interaction.member?.user?.id || interaction.user?.id;
  const targetId = selectedUserId(interaction);
  if (!senderId || !targetId) {
    return { type: 4, data: { content: "Please select a server member.", flags: 64 } };
  }

  if (interaction.data.name === "sportsmanship") {
    return {
      type: 4,
      data: {
        content: sportsmanshipMessage(senderId, targetId),
      },
    };
  }

  if (interaction.data.name === "unsportsmanlike") {
    return {
      type: 4,
      data: {
        content: unsportsmanlikeMessage(senderId, targetId),
      },
    };
  }

  return { type: 4, data: { content: "Unknown command.", flags: 64 } };
}
