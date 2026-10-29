// LifeQuest XP calculation rules
const BASE_XP = {
  easy: 50,
  medium: 100,
  hard: 200,
};

export function calculateXP({ difficulty = 'medium', hasProof = false, isGroup = true }) {
  let xp = BASE_XP[difficulty.toLowerCase()] || 100;
  if (hasProof) xp += 50; // Bonus for photo proof
  if (isGroup) xp += 100; // Bonus for squad quest
  return xp;
}

export default { calculateXP };
