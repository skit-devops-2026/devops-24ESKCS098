import CelebrateQuestModal from '../walloffame/CelebrateQuestModal';

/**
 * Step 8: QuestCompletionModal (Item 7 from Stitch Design System)
 *
 * Full celebratory modal triggered when completing a quest.
 * Features:
 *   - Drag-and-drop / file upload for proof photo with instant FileReader preview
 *   - Adventure photo presets (Mountain Trek, Deep Sea Scuba, Skydiving, etc.)
 *   - Reflection story / note textarea
 *   - Friend @tagging pills (+ @Sarah Chen, + @Marco Polo, etc.)
 *   - XP Reward banner (+250 XP)
 *   - Direct publishing to Wall of Fame feed with localStorage persistence
 *   - Mounted via createPortal(..., document.body)
 */
export function QuestCompletionModal(props) {
  return <CelebrateQuestModal {...props} />;
}

export default QuestCompletionModal;
