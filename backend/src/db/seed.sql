-- ==========================================================
-- LifeQuest Database Seed Data
-- ==========================================================

-- 1. Insert Initial Users
INSERT INTO users (id, name, email, avatar_url, bio)
VALUES
  (1, 'Alex Rivero', 'alex@lifequest.app', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGwAv94FtvOf1mF5L-lfyB9aCwx1UNQ9UZvMDaYLnF0Ur0kCnw2oaWvuL5NeYq7hKkBPahmlfZnsWDVUnb_znDz9i_h8AxB6MDwR0hueA2Huo7nCXAHNXPIwWABDmVo2czCGXfRAmsDWC4Gh60CGfArz2XGO6sgQ9mFBueM0TAcGb2xe77qz8PRvnZpGvKYAtnuvzTjW7I8qpgIXia-7OJ4_rmqjsTjHsM6xrQUyRJBtB4McTE6AR6', 'Adventure seeker & skydiving rookie.'),
  (2, 'Priya Sharma', 'priya@lifequest.app', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKroliD1w9821e4wMugprqu-0L6bjkY-8_N78i2fngH6XgKItbRSKK6saCnLJcLRLH5vflxkhKeZamVfl_lKFMC0j4KnQx0gnVIWU3PG8yLo8jwi1jQzK2ohD5D3JUghYhLVC9yFABBoJulOi_lka-0njoaF4Mc8oedX9jcwDu-0pp0gV4PIuezXkXIBZD1GDlkRbpaPVDn5NkIqmXPfRaAXSTf5CpkmYK68wZGHnDZMfckuBYyWxw', 'Motorcycle nomad & mountain lover.'),
  (3, 'Elena Vance', 'elena@lifequest.app', 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3HSnRMBfUiKLTTVz-r9NlkIjnrrTThFp0IbPVXpLlNPgMWEAE_AzPF_3q1gKLdZtX-L2sM4DUopi_V0Ad3Pp8ksOmvEFDvrrAc2i_1iWfI_k6mumBPHLcfeYS02rfVIKx20CG7tpGJns9Vvf-XqJZpJqOwTAZypQz_Kep1VB4T3TxHsRD6mThSxw9ril9D1rQH_471vxMCpyXu39zev5Rr7-s3esElO6fB82dRXi7s6TWbsLAAaY9', 'High altitude climber and marathoner.'),
  (4, 'Sarah Chen', 'sarah@lifequest.app', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80', 'Photographer and scuba diver.'),
  (5, 'Marco Polo', 'marco@lifequest.app', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80', 'Culinary explorer & food blogger.')
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 2. Insert Groups / Squads
INSERT INTO groups (id, name, description, cover_url, join_code, admin_id)
VALUES
  (1, 'Trip Squad ✈️', 'Weekend warriors & world explorers', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80', 'LQ-TRIP', 1),
  (2, 'College Gang 🎓', 'Alma mater reunion quest crew', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80', 'LQ-CLG1', 2),
  (3, 'Fitness Freaks 🏋️', 'Cardio endurance and marathons', 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&q=80', 'LQ-FITN', 3)
ON CONFLICT (id) DO NOTHING;

SELECT setval('groups_id_seq', (SELECT MAX(id) FROM groups));

-- 3. Group Memberships
INSERT INTO group_members (group_id, user_id, role)
VALUES
  (1, 1, 'admin'),
  (1, 2, 'member'),
  (1, 3, 'member'),
  (1, 4, 'member'),
  (1, 5, 'member'),
  (2, 1, 'member'),
  (2, 2, 'admin'),
  (3, 1, 'member'),
  (3, 3, 'admin')
ON CONFLICT (group_id, user_id) DO NOTHING;

-- 4. Initial Badges
INSERT INTO badges (id, title, category, icon, description, bg_color)
VALUES
  ('badge-1', 'Summit Conqueror', 'ADVENTURE', '🏔️', 'Climbed 3,000m+ peak with Squad', '#FFED00'),
  ('badge-2', 'Deep Sea Explorer', 'TRAVEL', '🤿', 'Completed open water ocean dive', '#BDF2FF'),
  ('badge-3', 'First To Finish', 'SQUAD', '⚡', 'Completed group challenge ahead of squad', '#B4F8C8'),
  ('badge-4', 'Streak Titan', 'CONSISTENCY', '🔥', 'Logged adventure progress 4 weeks in a row', '#FFDAD6'),
  ('badge-5', 'Master Chef', 'SKILLS', '🍝', 'Cooked 5 international authentic recipes', '#E0BBFF')
ON CONFLICT (id) DO NOTHING;

-- 5. User Unlocked Badges for Alex (User 1)
INSERT INTO user_badges (user_id, badge_id)
VALUES
  (1, 'badge-1'),
  (1, 'badge-2'),
  (1, 'badge-3'),
  (1, 'badge-4'),
  (1, 'badge-5')
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 6. Initial Posts
INSERT INTO posts (id, type, author_id, group_id, title, caption, badge_label, stat_badge, xp_earned, visibility, completed_at)
VALUES
  (1, 'solo', 1, 1, 'First Solo Skydive from 15,000 ft', 'Just finished my first solo skydive! 🪂 The freefall adrenaline was absolute madness.', 'Marathon Finisher', '15,000 ft altitude', 350, 'shared', NOW() - INTERVAL '1 hour'),
  (2, 'solo', 2, 2, 'Solo Bike Odyssey to Ladakh (Khardung La)', 'Solo bike trip to Ladakh done and dusted! 🏍️ Cold winds, warm hearts, and unforgettable passes.', 'Solo Trip Done', '7 days • 900 km', 500, 'shared', NOW() - INTERVAL '5 hours'),
  (3, 'solo', 3, 3, 'Run a Half Marathon under 2 hours', 'Crossed the finish line in 1h 54m! Trained 16 weeks through rain and shine.', 'Cardio Beast', '21.1 km • 1h 54m', 400, 'shared', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

SELECT setval('posts_id_seq', (SELECT MAX(id) FROM posts));

-- 7. Post Images
INSERT INTO post_images (post_id, image_url)
VALUES
  (1, 'https://cdn-imgix.headout.com/tour/19210/TOUR-IMAGE/41bf9e61-4def-4e7d-bd13-a5b27ff477ae-SAWGD2-21-1-.jpg?auto=format&q=90&fit=crop&crop=faces'),
  (2, 'https://wanderon-images.gumlet.io/blogs/new/2025/01/best-time-for-leh-ladakh-solo-bike-trip.jpg'),
  (3, 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80')
ON CONFLICT DO NOTHING;

-- 8. Post Tagged Friends
INSERT INTO post_tags (post_id, user_id)
VALUES
  (1, 4), -- Tagged Sarah Chen
  (1, 5), -- Tagged Marco Polo
  (2, 1)  -- Tagged Alex
ON CONFLICT DO NOTHING;

-- 9. Post Reactions
INSERT INTO reactions (post_id, user_id, type)
VALUES
  (1, 2, 'fire'),
  (1, 3, 'clap'),
  (1, 4, 'party'),
  (1, 5, 'epic'),
  (2, 1, 'fire'),
  (2, 3, 'clap'),
  (2, 4, 'like')
ON CONFLICT (post_id, user_id) DO NOTHING;

-- 10. Post Comments
INSERT INTO comments (post_id, author_id, text, created_at)
VALUES
  (1, 4, 'Amazing job Alex, you crushed it! 🚀', NOW() - INTERVAL '45 minutes'),
  (1, 5, 'Total inspiration. Which summit or jump is next? 🌏', NOW() - INTERVAL '30 minutes'),
  (2, 3, 'That mountain pass view is unreal Priya! Proud of you!', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;
