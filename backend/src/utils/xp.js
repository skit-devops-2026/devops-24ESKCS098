// LifeQuest XP Calculation Rules (Section 5)
const BASE_XP = {
  easy: 50,
  medium: 100,
  hard: 200,
};

function calculateXP({ difficulty = 'medium', hasProof = false, isGroup = true }) {
  let xp = BASE_XP[difficulty.toLowerCase()] || 100;
  if (hasProof) xp += 50; // Bonus for photo proof (+50 XP)
  if (isGroup) xp += 100; // Bonus for squad group quest (+100 XP)
  return xp;
}

module.exports = { calculateXP };
