'use strict';

/**
 * LifeQuest Group & Team-Goal Isolation Tests
 * Tests multi-user isolation, join codes, permissions, and private/public access.
 */

const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('./src/app');

const JWT_SECRET = process.env.JWT_SECRET || 'lifequest_secret';

let server;
let baseUrl;
let passed = 0;
let failed = 0;

function assert(description, condition, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}${details ? ' — ' + details : ''}`);
    failed++;
  }
}

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

const USER_1 = { id: 101, email: 'quester1@lifequest.io', name: 'Quester Alpha' };
const USER_2 = { id: 102, email: 'quester2@lifequest.io', name: 'Quester Beta' };

const TOKEN_1 = makeToken(USER_1);
const TOKEN_2 = makeToken(USER_2);

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${baseUrl}${path}`;
    const url = new URL(fullUrl);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const bodyStr = body ? JSON.stringify(body) : null;
    if (bodyStr) headers['Content-Length'] = Buffer.byteLength(bodyStr);

    const req = http.request(
      url,
      { method, headers },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let data = {};
          try {
            data = JSON.parse(raw);
          } catch {
            data = { raw };
          }
          resolve({ status: res.statusCode, data });
        });
      }
    );

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function run() {
  console.log('\n🧪 LifeQuest Group & Team-Goal Isolation Tests\n');

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      console.log(`✓ Test server running at ${baseUrl}`);
      resolve();
    });
  });

  // Wait for MongoDB connection readyState === 1
  let attempts = 0;
  while (mongoose.connection.readyState !== 1 && attempts < 50) {
    await new Promise((r) => setTimeout(r, 100));
    attempts++;
  }

  try {
    // 1. User 1 creates Squad Alpha
    const squad1Res = await request('POST', '/bucketlist/squads', {
      name: 'Squad Alpha',
      description: 'Alpha team for epic adventures',
      isPrivate: true,
    }, TOKEN_1);
    assert('User 1 creates Squad Alpha (201)', squad1Res.status === 201);
    const squadAlpha = squad1Res.data.squad;
    assert('Squad Alpha has join code', Boolean(squadAlpha?.join_code));

    // 2. User 2 creates Squad Beta
    const squad2Res = await request('POST', '/bucketlist/squads', {
      name: 'Squad Beta',
      description: 'Beta team for wilderness treks',
      isPrivate: true,
    }, TOKEN_2);
    assert('User 2 creates Squad Beta (201)', squad2Res.status === 201);
    const squadBeta = squad2Res.data.squad;

    // 3. User 1 creates Team Goal in Squad Alpha
    const goalAlphaRes = await request('POST', `/bucketlist/squads/${squadAlpha.id}/goals`, {
      title: 'Summit Mount Alpha',
      description: 'Group trek to Alpha Peak',
      category: 'ADVENTURE',
      difficulty: 'hard',
    }, TOKEN_1);
    assert('User 1 adds goal to Squad Alpha (201)', goalAlphaRes.status === 201);
    const goalAlpha = goalAlphaRes.data.goal;

    // 4. User 2 creates Team Goal in Squad Beta
    const goalBetaRes = await request('POST', `/bucketlist/squads/${squadBeta.id}/goals`, {
      title: 'Kayak Lake Beta',
      description: 'Paddle across Lake Beta',
      category: 'ADVENTURE',
      difficulty: 'medium',
    }, TOKEN_2);
    assert('User 2 adds goal to Squad Beta (201)', goalBetaRes.status === 201);
    const goalBeta = goalBetaRes.data.goal;

    // 5. ISOLATION CHECK: Squad Alpha goals must NOT include Squad Beta goals
    const alphaGoalsRes = await request('GET', `/bucketlist/squads/${squadAlpha.id}/goals`, null, TOKEN_1);
    assert('User 1 can get Squad Alpha goals (200)', alphaGoalsRes.status === 200);
    const alphaGoalTitles = (alphaGoalsRes.data.goals || []).map((g) => g.title);
    assert('Squad Alpha contains "Summit Mount Alpha"', alphaGoalTitles.includes('Summit Mount Alpha'));
    assert('Squad Alpha DOES NOT contain "Kayak Lake Beta"', !alphaGoalTitles.includes('Kayak Lake Beta'));

    // 6. ISOLATION CHECK: Squad Beta goals must NOT include Squad Alpha goals
    const betaGoalsRes = await request('GET', `/bucketlist/squads/${squadBeta.id}/goals`, null, TOKEN_2);
    assert('User 2 can get Squad Beta goals (200)', betaGoalsRes.status === 200);
    const betaGoalTitles = (betaGoalsRes.data.goals || []).map((g) => g.title);
    assert('Squad Beta contains "Kayak Lake Beta"', betaGoalTitles.includes('Kayak Lake Beta'));
    assert('Squad Beta DOES NOT contain "Summit Mount Alpha"', !betaGoalTitles.includes('Summit Mount Alpha'));

    // 7. PRIVACY CHECK: User 2 cannot access Squad Alpha (private) before joining
    const nonMemberCheck = await request('GET', `/bucketlist/squads/${squadAlpha.id}/goals`, null, TOKEN_2);
    assert('User 2 cannot view private Squad Alpha before joining (403)', nonMemberCheck.status === 403);

    // 8. INVALID JOIN CODE: User 2 joins with invalid code
    const invalidJoin = await request('POST', '/bucketlist/squads/join', {
      joinCode: 'LQ-INVALID999',
    }, TOKEN_2);
    assert('Invalid join code returns 404', invalidJoin.status === 404);

    // 9. VALID JOIN CODE: User 2 joins Squad Alpha with valid join code
    const joinAlpha = await request('POST', '/bucketlist/squads/join', {
      joinCode: squadAlpha.join_code,
    }, TOKEN_2);
    assert('User 2 joins Squad Alpha with valid code (200)', joinAlpha.status === 200);

    // 10. PREVENT DUPLICATE MEMBERSHIP
    const dupJoin = await request('POST', '/bucketlist/squads/join', {
      joinCode: squadAlpha.join_code,
    }, TOKEN_2);
    assert('Duplicate join returns 200 with already member message', dupJoin.status === 200);

    // 11. AFTER JOINING: User 2 can now access Squad Alpha goals
    const joinedAlphaGoals = await request('GET', `/bucketlist/squads/${squadAlpha.id}/goals`, null, TOKEN_2);
    assert('User 2 can now access Squad Alpha goals (200)', joinedAlphaGoals.status === 200);

    // 12. ROLE PERMISSION CHECK: User 2 (member) cannot edit squad details (admin only)
    const nonAdminEdit = await request('PUT', `/bucketlist/squads/${squadAlpha.id}`, {
      description: 'Hacked description',
    }, TOKEN_2);
    assert('Non-admin member cannot update squad details (403)', nonAdminEdit.status === 403);

    // 13. SQUAD ADMIN CAN EDIT SQUAD DETAILS
    const adminEdit = await request('PUT', `/bucketlist/squads/${squadAlpha.id}`, {
      description: 'Official updated Alpha description',
    }, TOKEN_1);
    assert('Squad admin can update squad details (200)', adminEdit.status === 200);

    // 14. CONTRIBUTION TRACKING: User 2 contributes to Squad Alpha goal
    const contribRes = await request(
      'PATCH',
      `/bucketlist/squads/${squadAlpha.id}/goals/${goalAlpha.id}/contribution`,
      { progress: 60, note: 'Trek prep complete!' },
      TOKEN_2
    );
    assert('User 2 can log individual progress contribution (200)', contribRes.status === 200);
    assert('Contribution recorded progress 60', contribRes.data.myContribution?.progress === 60);

    // 15. CREATOR/ADMIN PERMISSION: User 2 cannot delete User 1's goal (not creator and not squad admin)
    const nonCreatorDelete = await request(
      'DELETE',
      `/bucketlist/squads/${squadAlpha.id}/goals/${goalAlpha.id}`,
      null,
      TOKEN_2
    );
    assert('Non-creator/non-admin member cannot delete team goal (403)', nonCreatorDelete.status === 403);

    // 16. CREATOR CAN DELETE GOAL
    const creatorDelete = await request(
      'DELETE',
      `/bucketlist/squads/${squadAlpha.id}/goals/${goalAlpha.id}`,
      null,
      TOKEN_1
    );
    assert('Creator can delete team goal (200)', creatorDelete.status === 200);

    console.log(`\n──────────────────────────────────────────────────`);
    console.log(`Isolation Results: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal error during isolation test:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  }
}

run();
