/**
 * BucketList API smoke tests
 * Tests against the running backend (http://localhost:5000) using the dev auth header.
 *
 * Usage: node backend/test_bucketlist_api.js
 *
 * All tests hit the API serially and print PASS / FAIL with details.
 * Requires the backend to be running: cd backend && npm run dev
 */
'use strict';

let BASE = 'http://localhost:5000/api';
const DEV_HEADER = { 'x-dev-user-id': '1', 'Content-Type': 'application/json' };
let serverInstance = null;

let passed = 0;
let failed = 0;
let createdGoalId = null;
let createdSquadId = null;
let createdTeamGoalId = null;

async function req(method, path, body, customHeaders = DEV_HEADER) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: customHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function run() {
  console.log('\n🧪 BucketList API Smoke Tests\n');

  // Verify or start backend server
  try {
    const health = await fetch(`${BASE}/health`).then((r) => r.json());
    if (health.status === 'ok') {
      console.log('Connected to existing backend server at ' + BASE);
    }
  } catch {
    console.log('No backend running on port 5000; starting in-process test server...');
    const app = require('./src/app');
    await new Promise((resolve) => {
      serverInstance = app.listen(0, () => {
        const port = serverInstance.address().port;
        BASE = `http://localhost:${port}/api`;
        console.log(`Test server running at ${BASE}`);
        resolve();
      });
    });
  }

  // ── Health ──────────────────────────────────────────────────────────────────
  console.log('── Health Check ──');
  {
    const { status } = await req('GET', '/health');
    assert('GET /api/health returns 200', status === 200);
  }

  // ── Personal Goals ──────────────────────────────────────────────────────────
  console.log('\n── Personal Goals ──');
  {
    const { status, data } = await req('GET', '/bucketlist/goals');
    assert('GET /bucketlist/goals returns 200', status === 200, JSON.stringify(data));
    assert('Response has goals array', Array.isArray(data.goals), JSON.stringify(data));
  }

  {
    // Invalid create (missing title)
    const { status, data } = await req('POST', '/bucketlist/goals', {
      description: 'no title',
    });
    assert('POST /bucketlist/goals rejects missing title with 400', status === 400, data.message);
  }

  {
    const { status, data } = await req('POST', '/bucketlist/goals', {
      title: 'API Test Goal',
      description: 'Created by automated test',
      category: 'ADVENTURE',
      difficulty: 'medium',
      visibility: 'public',
    });
    assert('POST /bucketlist/goals creates goal (201)', status === 201, JSON.stringify(data));
    if (data.goal) {
      createdGoalId = data.goal.id;
      assert('Created goal has id', Boolean(createdGoalId));
      assert('Created goal status is not-started', data.goal.status === 'not-started');
      assert('Created goal progress is 0', data.goal.progress === 0);
      assert('Created goal visibility mapped correctly', data.goal.visibility === 'public');
    }
  }

  if (createdGoalId) {
    const { status, data } = await req('GET', `/bucketlist/goals/${createdGoalId}`);
    assert('GET /bucketlist/goals/:id returns the created goal', status === 200 && data.goal?.id === createdGoalId);
  }

  if (createdGoalId) {
    const { status, data } = await req('PUT', `/bucketlist/goals/${createdGoalId}`, {
      title: 'API Test Goal Updated',
      description: 'Updated by automated test',
      category: 'TRAVEL',
      difficulty: 'easy',
      visibility: 'private',
    });
    assert('PUT /bucketlist/goals/:id updates goal (200)', status === 200, JSON.stringify(data));
    assert('Updated title matches', data.goal?.title === 'API Test Goal Updated');
    assert('Updated visibility mapped (private)', data.goal?.visibility === 'private');
  }

  if (createdGoalId) {
    const { status, data } = await req('PATCH', `/bucketlist/goals/${createdGoalId}/status`, {
      status: 'in-progress',
      progress: 50,
    });
    assert('PATCH /bucketlist/goals/:id/status updates status (200)', status === 200, JSON.stringify(data));
    assert('Status is in-progress', data.goal?.status === 'in-progress');
    assert('Progress is 50', data.goal?.progress === 50);
  }

  if (createdGoalId) {
    const { status, data } = await req('PATCH', `/bucketlist/goals/${createdGoalId}/status`, {
      status: 'invalid-status',
    });
    assert('PATCH with invalid status returns 400', status === 400, data.message);
  }

  // ── Overall Stats ───────────────────────────────────────────────────────────
  console.log('\n── Overall Stats ──');
  {
    const { status, data } = await req('GET', '/bucketlist/stats');
    assert('GET /bucketlist/stats returns 200', status === 200, JSON.stringify(data));
    assert('Stats has total count', typeof data.stats?.total === 'number');
    assert('Stats has completion rate', typeof data.stats?.completionRate === 'number');
  }

  // ── Squads ──────────────────────────────────────────────────────────────────
  console.log('\n── Squads ──');
  {
    const { status, data } = await req('GET', '/bucketlist/squads');
    assert('GET /bucketlist/squads returns 200', status === 200, JSON.stringify(data));
    assert('Response has squads array', Array.isArray(data.squads));
  }

  {
    const { status, data } = await req('POST', '/bucketlist/squads', {
      name: 'Test Squad API',
      description: 'Created by automated test',
    });
    assert('POST /bucketlist/squads creates squad (201)', status === 201, JSON.stringify(data));
    if (data.squad) {
      createdSquadId = data.squad.id;
      assert('Created squad has id', Boolean(createdSquadId));
      assert('Created squad has join_code', Boolean(data.squad.join_code));
    }
  }

  {
    // Test join with invalid code
    const { status } = await req('POST', '/bucketlist/squads/join', { joinCode: 'INVALID-CODE-999' });
    assert('POST /bucketlist/squads/join with invalid code returns 404', status === 404);
  }

  {
    // Test join with default seed squad code 'LQ-TRIP'
    const { status, data } = await req('POST', '/bucketlist/squads/join', { joinCode: 'LQ-TRIP' });
    assert('POST /bucketlist/squads/join with valid code returns 200', status === 200, JSON.stringify(data));
    assert('Response has squad info', Boolean(data.squad));
  }

  if (createdSquadId) {
    // Test get squad members
    const { status, data } = await req('GET', `/bucketlist/squads/${createdSquadId}/members`);
    assert('GET /bucketlist/squads/:id/members returns 200', status === 200, JSON.stringify(data));
    assert('Members is an array', Array.isArray(data.members));
  }

  if (createdSquadId) {
    // Test update squad details
    const { status, data } = await req('PUT', `/bucketlist/squads/${createdSquadId}`, {
      description: 'Updated motto/description for test squad',
    });
    assert('PUT /bucketlist/squads/:id updates squad (200)', status === 200, JSON.stringify(data));
    assert('Updated description matches', data.squad?.description === 'Updated motto/description for test squad');
  }

  // ── Team Goals ──────────────────────────────────────────────────────────────
  if (createdSquadId) {
    console.log('\n── Team Goals ──');
    {
      const { status, data } = await req('GET', `/bucketlist/squads/${createdSquadId}/goals`);
      assert('GET /bucketlist/squads/:id/goals returns 200', status === 200, JSON.stringify(data));
      assert('Response has goals array', Array.isArray(data.goals));
    }

    {
      const { status, data } = await req('POST', `/bucketlist/squads/${createdSquadId}/goals`, {
        title: 'Team API Test Goal',
        description: 'A team goal from automated test',
        category: 'FITNESS',
        difficulty: 'hard',
      });
      assert('POST /squads/:id/goals creates team goal (201)', status === 201, JSON.stringify(data));
      if (data.goal) {
        createdTeamGoalId = data.goal.id;
        assert('Team goal has id', Boolean(createdTeamGoalId));
      }
    }

    if (createdTeamGoalId) {
      const { status, data } = await req(
        'PATCH',
        `/bucketlist/squads/${createdSquadId}/goals/${createdTeamGoalId}/status`,
        { status: 'in-progress', progress: 25 }
      );
      assert('PATCH team goal status returns 200', status === 200, JSON.stringify(data));
    }

    if (createdTeamGoalId) {
      const { status } = await req('DELETE', `/bucketlist/squads/${createdSquadId}/goals/${createdTeamGoalId}`);
      assert('DELETE team goal returns 200', status === 200);
    }

    // Leave the created test squad
    {
      const { status } = await req('POST', `/bucketlist/squads/${createdSquadId}/leave`);
      assert('POST /bucketlist/squads/:id/leave leaves squad (200)', status === 200);
    }
  }

  // ── Cleanup: delete the test personal goal ──────────────────────────────────
  if (createdGoalId) {
    console.log('\n── Cleanup ──');
    const { status } = await req('DELETE', `/bucketlist/goals/${createdGoalId}`);
    assert('DELETE /bucketlist/goals/:id removes goal (200)', status === 200);

    const { status: status2 } = await req('GET', `/bucketlist/goals/${createdGoalId}`);
    assert('Deleted goal returns 404', status2 === 404);
  }

  // ── Auth boundary ───────────────────────────────────────────────────────────
  console.log('\n── Auth Boundary ──');
  {
    // Try to get a goal owned by a different user (user 1 tries to access a nonexistent id owned by nobody)
    const { status } = await req('DELETE', '/bucketlist/goals/999999');
    assert('DELETE non-existent goal returns 404 (not 500)', status === 404, `Got ${status}`);
  }

  // ── Browser Client Simulation (testing api.js request helper headers) ─────
  console.log('\n── Browser Client Simulation ──');
  {
    // Simulate exact options and merged headers produced by frontend api.js
    const options = {
      method: 'POST',
      headers: { 'x-dev-user-id': '1' },
      body: JSON.stringify({
        title: 'Browser Simulated Personal Goal',
        description: 'Verifies Content-Type: application/json is present',
        category: 'ADVENTURE',
      }),
    };
    const clientConfig = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };
    const res = await fetch(`${BASE}/bucketlist/goals`, clientConfig);
    const data = await res.json().catch(() => ({}));
    assert(
      'POST /bucketlist/goals with frontend request() header merge parses title successfully (201)',
      res.status === 201 && data.goal?.title === 'Browser Simulated Personal Goal',
      JSON.stringify(data)
    );
    if (data.goal?.id) {
      await req('DELETE', `/bucketlist/goals/${data.goal.id}`);
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (serverInstance) {
    serverInstance.close();
  }
  if (failed > 0) {
    console.error('❌ Some tests failed. Check backend logs.');
    process.exitCode = 1;
  } else {
    console.log('✅ All tests passed!');
  }
}

run().catch((err) => {
  console.error('Test runner error:', err.message);
  if (serverInstance) serverInstance.close();
  process.exitCode = 1;
});
