import FeedCard from '../FeedCard';

/**
 * Step 9: WallOfFameSocialCard (Item 8 from Stitch Design System)
 *
 * Neo-Brutalist social card for completed quest accomplishments.
 * Features:
 *   - Category sticker badge & squad tag
 *   - Author avatar with XP reward chip (+350 XP)
 *   - Tagged squad friends chips ("With: @Sarah Chen")
 *   - Proof photo preview with completion date stamp
 *   - Interactive like counter toggle
 *   - Multi-emoji floating reaction dock (🔥, ❤️, 👏, 🎉, ⚡) with counter pills
 *   - Speech-bubble comments feed & inline comment input
 *   - Shareable brag card modal trigger
 */
export function WallOfFameSocialCard(props) {
  return <FeedCard {...props} />;
}

export default WallOfFameSocialCard;
