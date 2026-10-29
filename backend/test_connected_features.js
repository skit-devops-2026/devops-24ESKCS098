/**
 * test_connected_features.js
 *
 * Verifies that:
 * 1. Guests can browse leaderboard, weekly stats, bucketlist stats, and public feed without 401 errors.
 * 2. Authenticated users can post achievements (celebration flow).
 * 3. Wall of Fame feed contains the newly created celebration.
 */
'use strict';

import http from 'http';
import mongoose from 'mongoose';
import app from './src/app.js';

let server;
let baseUrl;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(`${baseUrl}${path}`);
    const reqOptions = {
      hostname: fullUrl.hostname,
      port: fullUrl.port,
      path: `${fullUrl.pathname}${fullUrl.search}`,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

async function runTests() {
  console.log('\n🧪 Testing Connected Features & Guest Accessibility\n');

  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api`;
  console.log(`✓ Test server running at ${baseUrl}`);

  try {
    // 1. Guest accesses /leaderboard
    const lbRes = await request('/leaderboard');
    assert(lbRes.status === 200, `Guest can fetch leaderboard (status ${lbRes.status})`);
    assert(Array.isArray(lbRes.body?.top), 'Leaderboard has top rankings array');
    assert(lbRes.body?.me !== undefined, 'Leaderboard includes guest me placeholder');

    // 2. Guest accesses /bucketlist/stats
    const statsRes = await request('/bucketlist/stats');
    assert(statsRes.status === 200, `Guest can fetch bucketlist stats (status ${statsRes.status})`);
    assert(typeof statsRes.body?.stats?.total === 'number', 'Stats contains total count');

    // 3. Guest accesses /posts/stats/weekly
    const weeklyRes = await request('/posts/stats/weekly');
    assert(weeklyRes.status === 200, `Guest can fetch weekly stats (status ${weeklyRes.status})`);
    assert(typeof weeklyRes.body?.weeklyCompleted === 'number', 'Weekly stats has weeklyCompleted count');

    // 4. Guest accesses /posts?filter=all
    const feedRes = await request('/posts?filter=all');
    assert(feedRes.status === 200, `Guest can browse public feed (status ${feedRes.status})`);
    assert(Array.isArray(feedRes.body?.posts), 'Public feed returns posts array');

    // 5. Signup user to test celebration -> Wall of Fame flow
    const signupRes = await request('/auth/signup', {
      method: 'POST',
      body: {
        name: 'Celebrator User',
        email: `celebrate_${Date.now()}@example.com`,
        password: 'Password123!',
      },
    });
    assert(signupRes.status === 201, 'Celebrator user registered (201)');
    const token = signupRes.body.token;

    // 6. User creates achievement post (Celebration flow)
    const postRes = await request('/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title: 'Summit Mount Everest Basecamp',
        subtitle: 'Conquered with the squad in sub-zero weather!',
        category: 'ADVENTURE',
        image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
        xp_earned: 350,
        badge: 'High Altitude Champion 🏆',
        is_public: true,
      },
    });
    assert(postRes.status === 201, `Achievement post created on Wall of Fame (status ${postRes.status})`);
    assert(postRes.body?.post?.title === 'Summit Mount Everest Basecamp', 'Created post has correct title');

    // 7. Verify post appears in community feed
    const updatedFeedRes = await request('/posts?filter=all');
    assert(updatedFeedRes.status === 200, 'Feed fetched after celebration (200)');
    const found = updatedFeedRes.body.posts.some((p) => p.title === 'Summit Mount Everest Basecamp');
    assert(found, 'Completed quest celebration appears live in Wall of Fame feed');

    console.log('\n──────────────────────────────────────────────────');
    console.log('Connected Features Results: All passed!\n');
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  if (server) server.close();
  process.exit(1);
});
