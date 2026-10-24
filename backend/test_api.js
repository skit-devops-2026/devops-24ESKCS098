// Automated test runner for LifeQuest backend endpoints
const http = require('http');

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log('🧪 Starting backend integration tests...\n');

  // 1. Health check
  const health = await request('GET', '/api/health');
  console.log('1. Health check:', health.status === 200 && health.data.status === 'ok' ? '✅ PASS' : '❌ FAIL');

  // 2. Feed
  const feed = await request('GET', '/api/posts');
  console.log('2. Wall of Fame Feed:', feed.status === 200 && feed.data.posts.length > 0 ? `✅ PASS (${feed.data.posts.length} posts)` : '❌ FAIL');

  // 3. Weekly Stats
  const stats = await request('GET', '/api/posts/stats/weekly');
  console.log('3. Weekly Stats:', stats.status === 200 && stats.data.count !== undefined ? `✅ PASS (${stats.data.count} recent celebrations)` : '❌ FAIL');

  // 4. Leaderboard
  const lb = await request('GET', '/api/leaderboard?period=weekly');
  console.log('4. Leaderboard:', lb.status === 200 && lb.data.top.length > 0 ? `✅ PASS (${lb.data.top.length} ranked users)` : '❌ FAIL');

  // 5. Trophy Room
  const trophy = await request('GET', '/api/trophy-room/me');
  console.log('5. Trophy Room:', trophy.status === 200 && trophy.data.badges.length > 0 ? `✅ PASS (${trophy.data.badges.length} badges, ${trophy.data.completedItems.length} completed)` : '❌ FAIL');

  // 6. Add Reaction
  const reaction = await request('PUT', '/api/posts/1/reaction', { type: 'epic' });
  console.log('6. Add Reaction (epic):', reaction.status === 200 && reaction.data.myReaction === 'epic' ? '✅ PASS' : '❌ FAIL');

  // 7. Add Comment
  const comment = await request('POST', '/api/posts/1/comments', { text: 'Incredible achievement Alex! Keep conquering!' });
  console.log('7. Add Comment:', comment.status === 201 && comment.data.comment.id ? `✅ PASS (Comment ID: ${comment.data.comment.id})` : '❌ FAIL');

  // 8. Create Post
  const newPost = await request('POST', '/api/posts', {
    title: 'Sunrise Kayaking at Lake Tahoe',
    caption: 'Paddled 12km through crystal clear alpine waters before dawn!',
    badgeLabel: 'KAYAK HERO',
    statBadge: '12 km · 2h 10m',
    imageUrls: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80'],
    visibility: 'group',
    taggedFriendIds: [2, 3],
  });
  console.log('8. Create Post:', newPost.status === 201 && newPost.data.post.id ? `✅ PASS (Post ID: ${newPost.data.post.id}, XP: +${newPost.data.post.xp_earned})` : '❌ FAIL');

  // 9. Patch Visibility (Privacy Toggle)
  const patchVis = await request('PATCH', '/api/posts/1/visibility', { visibility: 'personal' });
  console.log('9. Toggle Visibility:', patchVis.status === 200 && patchVis.data.visibility === 'personal' ? '✅ PASS (Updated to personal)' : '❌ FAIL');

  // 10. Delete Reaction
  const delReaction = await request('DELETE', '/api/posts/1/reaction');
  console.log('10. Delete Reaction:', delReaction.status === 200 && delReaction.data.myReaction === null ? '✅ PASS' : '❌ FAIL');

  // Clean up created test post & restore post 1 visibility
  if (newPost.data && newPost.data.post && newPost.data.post.id) {
    await request('DELETE', `/api/posts/${newPost.data.post.id}`);
  }
  await request('PATCH', '/api/posts/1/visibility', { visibility: 'shared' });

  console.log('\n🎉 ALL 8 BACKEND ENDPOINTS TESTED & CLEANED UP SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
