const compliments = [
  "You're doing great bud.",
  "Hope you're having fun.",
  "Love ya.",
  "My love poureth over into green, baby.",
  "Keep trying!",
];

const insults = [
  "You fucking suck buster.",
  "I hate you so much bud.",
  "Get bent, punk.",
  "Hope you have a great weekend.",
  "Get fucked idiot.",
];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export const sportsmanshipMessage = (senderId, targetId) =>
  `🏅 <@${senderId}> recognizes <@${targetId}> for outstanding sportsmanship. ${randomItem(compliments)}`;

export const unsportsmanlikeMessage = (senderId, targetId) =>
  `🚩 <@${senderId}> has filed an unsportsmanlike-conduct report against <@${targetId}>. ${randomItem(insults)}`;
