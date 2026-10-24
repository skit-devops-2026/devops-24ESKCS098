import FullLeaderboardModal from '../walloffame/FullLeaderboardModal';

/**
 * Step 11: SquadLeaderboardModal (Item 11 from Stitch Design System)
 *
 * Full leaderboard modal triggered from "View Full Rankings".
 * Features:
 *   - Medals for top 3 (🥇, 🥈, 🥉) and numbered ranks
 *   - Highlighted "You" row for current user
 *   - Search by member or squad name
 *   - Filter tabs: 'All Time', 'This Month', 'Top Streaks 🔥'
 *   - Retro sticker badges: "🚀 Most Adventurous", "⚡ First to Finish", "🏍️ Nomad Rider", "🎨 Craft Specialist"
 *   - Total XP and completed quests tally
 *   - Portal-mounted with backdrop blur
 */
export function SquadLeaderboardModal(props) {
  return <FullLeaderboardModal {...props} />;
}

export default SquadLeaderboardModal;
