const compliments = [
  "You're doing great bud.",
  "Hope you're having fun.",
  "Love ya.",
  "My love poureth over into green, baby.",
  "Keep trying!",
  "Better luck next time",
  "Good game",
  "Looking great, bud.",
  "Its a long season, you'll get them next time",
  "At least you are giving it your best :)"
];

const insults = [
  "You fucking suck buster.",
  "I hate you so much bud.",
  "Get bent, punk.",
  "Hope you have a great weekend.",
  "Get fucked idiot.",
  "Cry me a river",
  "Looks like somebody forgot to brush their hair this morning",
  "get a room"
];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export const sportsmanshipMessage = (senderId, targetId) =>
  `🏅 <@${senderId}> recognizes <@${targetId}> for outstanding sportsmanship. ${randomItem(compliments)}`;

export const unsportsmanlikeMessage = (senderId, targetId) =>
  `🚩 <@${senderId}> has filed an unsportsmanlike-conduct report against <@${targetId}>. ${randomItem(insults)}`;
