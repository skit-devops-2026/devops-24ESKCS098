-- ==========================================================
-- LifeQuest Database Schema (PostgreSQL)
-- Module: Wall of Fame & Gamification
-- ==========================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL DEFAULT '$2a$10$e8wZ...',
  avatar_url    TEXT,
  bio           TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Groups / Squads Table
CREATE TABLE IF NOT EXISTS groups (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  cover_url   TEXT,
  join_code   VARCHAR(20) UNIQUE,
  is_private  BOOLEAN DEFAULT TRUE,
  admin_id    INT REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Group Membership & Roles
CREATE TABLE IF NOT EXISTS group_members (
  group_id   INT REFERENCES groups(id) ON DELETE CASCADE,
  user_id    INT REFERENCES users(id)  ON DELETE CASCADE,
  role       VARCHAR(10) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- 4. Bucket List Items (Quests)
CREATE TABLE IF NOT EXISTS items (
  id           SERIAL PRIMARY KEY,
  owner_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id     INT REFERENCES groups(id) ON DELETE SET NULL,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  category     VARCHAR(30) DEFAULT 'ADVENTURE',
  difficulty   VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  visibility   VARCHAR(10) NOT NULL DEFAULT 'shared' CHECK (visibility IN ('personal', 'shared')),
  status       VARCHAR(15) NOT NULL DEFAULT 'completed' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Wall of Fame Posts (Completed Achievements)
CREATE TABLE IF NOT EXISTS posts (
  id           SERIAL PRIMARY KEY,
  type         VARCHAR(10) NOT NULL DEFAULT 'solo' CHECK (type IN ('solo', 'group')),
  item_id      INT REFERENCES items(id) ON DELETE SET NULL,
  author_id    INT REFERENCES users(id) ON DELETE CASCADE,
  group_id     INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  caption      TEXT,
  badge_label  VARCHAR(100) DEFAULT 'Quest Conquered',
  stat_badge   VARCHAR(100),
  xp_earned    INT NOT NULL DEFAULT 100,
  visibility   VARCHAR(10) NOT NULL DEFAULT 'shared' CHECK (visibility IN ('personal', 'shared')),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Proof Photos per Post
CREATE TABLE IF NOT EXISTS post_images (
  id        SERIAL PRIMARY KEY,
  post_id   INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL
);

-- 7. Group Post Participating Members
CREATE TABLE IF NOT EXISTS post_members (
  post_id INT REFERENCES posts(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

-- 8. Tagged Friends ("Did this with @Sarah")
CREATE TABLE IF NOT EXISTS post_tags (
  post_id INT REFERENCES posts(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

-- 9. Reactions (Reactions & Likes: upsert 1 per user per post)
CREATE TABLE IF NOT EXISTS reactions (
  post_id    INT REFERENCES posts(id) ON DELETE CASCADE,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(15) NOT NULL DEFAULT 'like' CHECK (type IN ('like', 'fire', 'clap', 'party', 'epic', 'star')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- 10. Comments
CREATE TABLE IF NOT EXISTS comments (
  id         SERIAL PRIMARY KEY,
  post_id    INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text       VARCHAR(300) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Gamification Badges
CREATE TABLE IF NOT EXISTS badges (
  id          VARCHAR(50) PRIMARY KEY,
  title       VARCHAR(100) NOT NULL,
  category    VARCHAR(30) NOT NULL,
  icon        VARCHAR(10) NOT NULL,
  description TEXT,
  bg_color    VARCHAR(30) DEFAULT '#FFED00'
);

-- 12. User Unlocked Badges (Trophy Room)
CREATE TABLE IF NOT EXISTS user_badges (
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  badge_id    VARCHAR(50) REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_posts_group_completed  ON posts (group_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_completed ON posts (author_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_completed        ON posts (completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_created  ON comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reactions_post         ON reactions (post_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user     ON group_members (user_id);
