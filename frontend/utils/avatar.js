/**
 * LifeQuest Visual Avatar Utility
 *
 * Provides visually consistent, high-appeal quester avatars
 * with deterministic hashing so each user always retains the same
 * portrait across renders and page reloads.
 */

export const CURATED_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80', // Adventurer Alex / River
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', // Marco Polo / Trekker
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', // Sarah Chen / Photographer
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80', // Jordan Smith / Marathoner
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80', // Riya Sharma / Storyteller
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&q=80', // Nomad Explorer
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&q=80', // Alpine Climber
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80', // Ocean Diver
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&q=80', // Trail Blazer
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80', // Expedition Leader
];

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a high-quality, stable quester avatar for any user.
 */
export function getUserAvatar(user, fallbackSeed = '') {
  if (user) {
    if (typeof user === 'number' || typeof user === 'string') {
      const idx = simpleHash(String(user)) % CURATED_AVATARS.length;
      return CURATED_AVATARS[idx];
    }


    const explicit = user.avatar_url || user.avatar;
    if (
      explicit &&
      typeof explicit === 'string' &&
      !explicit.includes('dicebear.com/7.x/bottts') &&
      !explicit.includes('ui-avatars.com')
    ) {
      return explicit;
    }

    const seed = String(user.id || user.email || user.name || fallbackSeed || 'quester');
    const idx = simpleHash(seed) % CURATED_AVATARS.length;
    return CURATED_AVATARS[idx];
  }

  const seed = String(fallbackSeed || 'quester');
  const idx = simpleHash(seed) % CURATED_AVATARS.length;
  return CURATED_AVATARS[idx];
}
