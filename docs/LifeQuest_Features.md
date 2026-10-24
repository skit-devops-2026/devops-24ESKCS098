# LifeQuest — Feature Documentation

**A Collaborative Bucket List and Goal Tracking Platform for Friend Groups**

---

## Table of Contents
1. [User & Group Management](#1-user--group-management)
2. [Bucket List Items](#2-bucket-list-items)
3. [Progress Tracking](#3-progress-tracking)
4. [Completion & Celebration](#4-completion--celebration)
5. [Social Interaction](#5-social-interaction)
6. [Group Challenges](#6-group-challenges)
7. [Notifications & Reminders](#7-notifications--reminders)
8. [Leaderboard & Gamification](#8-leaderboard--gamification)
9. [Year-End Recap](#9-year-end-recap)
10. [Search & Discovery](#10-search--discovery)
11. [Privacy Controls](#11-privacy-controls)
12. [Admin/Moderation (Optional)](#12-adminmoderation-optional)
13. [Technical Module Breakdown](#13-technical-module-breakdown)

---

## 1. User & Group Management

| Feature | Description |
|---|---|
| Registration & Login | Email or phone-based signup; JWT-based session authentication |
| Profile Setup | Name, profile picture, bio (optional) |
| Group Creation | Users can create a group with a name, description, and cover image |
| Group Invitations | Invite friends via shareable link or unique join code |
| Multi-Group Membership | A user can belong to multiple groups simultaneously (e.g., College Friends, Trip Squad, Family) |
| Member Roles | Group creator/admin vs. regular member (admin can remove members, edit group info) |
| Leave/Remove Group | Members can leave a group; admins can remove members |

---

## 2. Bucket List Items

| Feature | Description |
|---|---|
| Add Item | Title, description, category, optional image |
| Categories | Travel, Food, Adventure, Skill, Career, Fitness, Custom |
| Visibility Type | Personal (visible only to creator) or Shared (visible to entire group) |
| Deadline/Target Date | Optional field to set a target completion date |
| Difficulty/Priority Tag | Easy / Medium / Hard, or High / Medium / Low priority |
| Edit/Delete Item | Creator can modify or remove their own items |
| Sub-tasks (Stretch) | Break a large goal into smaller checkpoints (e.g., "Visit 5 countries" → individual country entries) |

---

## 3. Progress Tracking

| Feature | Description |
|---|---|
| Status Lifecycle | Not Started → In Progress → Completed |
| Progress Notes | Add text updates while an item is in progress (e.g., "Booked flights for Goa") |
| Progress Percentage | For multi-step goals, show completion percentage (e.g., 2/5 countries visited = 40%) |
| Status Change Log | Track history of status changes with timestamps |

---

## 4. Completion & Celebration

| Feature | Description |
|---|---|
| Proof Upload | Photo/video upload required or optional upon marking an item complete |
| Completion Date | Auto-recorded when status changes to Completed |
| Wall of Fame | A group-wide feed showcasing all completed items with photos, similar to a social feed |
| Personal Achievement Log | A private view of all items a user has personally completed across groups |

---

## 5. Social Interaction

| Feature | Description |
|---|---|
| Emoji Reactions | Quick reactions (🔥 ❤️ 👏 🎉) on completed items |
| Comments | Short text comments on completed items |
| Tagging Friends | Tag group members in a completed item (e.g., "Did this with @Riya") |

---

## 6. Group Challenges

| Feature | Description |
|---|---|
| Shared Group Goals | Create a single challenge for the entire group (e.g., "Everyone treks together this year") |
| Individual Contribution Tracking | Track each member's progress toward the shared challenge |
| Challenge Completion | Mark the group challenge complete when all/majority members finish their part |

---

## 7. Notifications & Reminders

| Feature | Description |
|---|---|
| Deadline Reminders | Notify users as a target date approaches |
| Completion Alerts | Notify group members when someone completes an item |
| Progress Nudges | Periodic reminders to update progress on in-progress items |
| Invitation Alerts | Notify users when added to a new group |
| Delivery Channels | Push notifications (Firebase Cloud Messaging) and/or email (Nodemailer) |

---

## 8. Leaderboard & Gamification

| Feature | Description |
|---|---|
| Group Leaderboard | Ranks members by number of completed items |
| Achievement Badges | Fun titles like "Most Adventurous," "Most Consistent," "First to Finish" |
| Streaks (Stretch) | Track consistency of activity/updates over time |

---

## 9. Year-End Recap

| Feature | Description |
|---|---|
| Auto-Generated Summary | End-of-year summary of items completed, categories explored, groups participated in |
| Shareable Recap Card | A visual, "Spotify Wrapped"-style shareable image/card for social media |

---

## 10. Search & Discovery

| Feature | Description |
|---|---|
| Filter Items | Filter by category, status, group, or deadline |
| Search | Search bucket list items by keyword |
| Trending Items (Stretch) | Show popular bucket list items across public groups for inspiration |

---

## 11. Privacy Controls

| Feature | Description |
|---|---|
| Item Visibility Toggle | Mark individual items as public (group-visible) or private (self-only) |
| Group Privacy | Groups can be private (invite-only) or public (discoverable, if implemented) |

---

## 12. Admin/Moderation (Optional)

| Feature | Description |
|---|---|
| Group Admin Controls | Remove members, edit group details, delete inappropriate content |
| Report Content | Members can flag inappropriate posts/comments for admin review |

---

## 13. Technical Module Breakdown

Suggested division of work across a 3-person team:

### Module A — Frontend / UI
- Group creation and joining screens
- Bucket list item creation/edit/view UI
- Wall of Fame feed (photos, reactions, comments)
- Leaderboard and recap display

### Module B — Backend / Core Logic
- Database schema design (Users, Groups, Items, Challenges)
- Item lifecycle API (create, update status, complete)
- Image/video upload handling (Cloudinary/AWS S3)
- Leaderboard and progress calculation logic

### Module C — Auth / Notifications
- User authentication (JWT-based)
- Group invite system (link/code generation and validation)
- Notification system (push/email for deadlines, completions, invites)
- Reactions and comments backend logic

---

## Suggested Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Node.js + Express |
| Database | MongoDB (flexible schema) or PostgreSQL |
| Image/Video Storage | Cloudinary or AWS S3 |
| Notifications | Firebase Cloud Messaging (push), Nodemailer (email) |
| Authentication | JWT + bcrypt for password hashing |
| Real-time updates (optional) | Socket.io |

---

*Document prepared for LifeQuest — a shared bucket list and goal-tracking platform for friend groups.*
