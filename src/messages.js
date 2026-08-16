const compliments = [
  "Your lineup decisions have the quiet elegance of a perfectly formatted spreadsheet, and honestly it is intimidating.",
  "You are the kind of league mate who makes sportsmanship look heroic enough for a slow-motion montage.",
  "Your fantasy instincts are so radiant that even your bench players probably feel emotionally supported.",
  "Competing against you is an honor, a privilege, and a deeply moving personal-growth opportunity.",
  "You carry this league with the grace of a champion and the warmth of a motivational office poster.",
  "Your roster management is proof that kindness, courage, and waiver priority can coexist beautifully.",
];

const insults = [
  "Your lineup has the structural integrity of wet cardboard.",
  "You manage your roster like the waiver wire personally offended you.",
  "Your team is less of a contender and more of a weekly public-service announcement.",
  "Your bench keeps outscoring your starters because even your mistakes have depth.",
  "You draft like autodraft asked for the night off.",
  "Your championship window is not closed; it was never installed.",
];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export const sportsmanshipMessage = (senderId, targetId) =>
  `🏅 <@${senderId}> recognizes <@${targetId}> for outstanding sportsmanship. ${randomItem(compliments)}`;

export const unsportsmanlikeMessage = (senderId, targetId) =>
  `🚩 <@${senderId}> has filed an unsportsmanlike-conduct report against <@${targetId}>. ${randomItem(insults)}`;
