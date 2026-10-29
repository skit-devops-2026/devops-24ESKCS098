'use strict';

import mongoose from 'mongoose';
import app from './src/app.js';

/**
 * Auth API Tests
 * Tests Signup, Login, Input Validations, Duplicate Email rejection,
 * Password Hashing verification, Protected Routes, and JWT Authentication.
 */

let BASE = 'http://localhost:5000/api';
let serverInstance = null;

let passed = 0;
let failed = 0;

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
  console.log('\n🧪 LifeQuest Auth API Tests\n');

  try {
    const health = await fetch(`${BASE}/health`).then((r) => r.json());
    if (health.status === 'ok') console.log(`✓ Connected to backend at ${BASE}`);
  } catch {
    console.log('No backend at :5000; starting in-process server...');
    await new Promise((resolve) => {
      serverInstance = app.listen(0, () => {
        const port = serverInstance.address().port;
        BASE = `http://localhost:${port}/api`;
        console.log(`✓ Test server at ${BASE}`);
        resolve();
      });
    });
  }

  const testEmail = `testuser_${Date.now()}@lifequest.app`;
  const testPassword = 'SecurePassword123!';
  const testName = 'Test Adventurer';

  // 1. Validation Failures
  console.log('── Validation Failures ──');
  {
    const res = await fetch(`${BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: testEmail, password: testPassword }),
    });
    assert('Reject signup without name (400)', res.status === 400);
  }

  {
    const res = await fetch(`${BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testName, email: 'invalid-email', password: testPassword }),
    });
    assert('Reject signup with invalid email (400)', res.status === 400);
  }

  {
    const res = await fetch(`${BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testName, email: testEmail, password: '123' }),
    });
    assert('Reject signup with short password (400)', res.status === 400);
  }

  // 2. Successful Signup
  console.log('\n── Successful Signup ──');
  let authToken = null;
  let authUser = null;
  {
    const res = await fetch(`${BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
        vibe: 'ADVENTURE',
      }),
    });
    const data = await res.json();
    assert('Signup succeeds with 201', res.status === 201);
    assert('Response contains token', Boolean(data.token));
    assert('User password_hash is omitted from response', data.user && !data.user.password_hash);
    assert('User name and email match', data.user?.name === testName && data.user?.email === testEmail);
    assert('User has numeric ID', typeof data.user?.id === 'number');
    authToken = data.token;
    authUser = data.user;
  }

  // 3. Duplicate Email Rejection
  console.log('\n── Duplicate Email Rejection ──');
  {
    const res = await fetch(`${BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Name',
        email: testEmail,
        password: testPassword,
      }),
    });
    assert('Duplicate email rejected (409)', res.status === 409);
  }

  // 4. Login Failures
  console.log('\n── Login Failures ──');
  {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword' }),
    });
    assert('Wrong password returns 401', res.status === 401);
  }

  {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@lifequest.app', password: 'password123' }),
    });
    assert('Nonexistent user returns 401', res.status === 401);
  }

  // 5. Successful Login
  console.log('\n── Successful Login ──');
  {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const data = await res.json();
    assert('Login succeeds with 200', res.status === 200);
    assert('Login returns JWT token', Boolean(data.token));
    assert('Password hash is never exposed', data.user && !data.user.password_hash);
    authToken = data.token;
  }

  // 6. Protected Route Verification (GET /api/auth/me)
  console.log('\n── Protected Route Verification ──');
  {
    const res = await fetch(`${BASE}/auth/me`, {
      headers: { 'Content-Type': 'application/json' },
    });
    assert('Protected route without token returns 401', res.status === 401);
  }

  {
    const res = await fetch(`${BASE}/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid.token.value',
      },
    });
    assert('Protected route with invalid token returns 401', res.status === 401);
  }

  {
    const res = await fetch(`${BASE}/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await res.json();
    assert('Protected route with valid JWT returns 200', res.status === 200);
    assert('Derived user ID matches registered user ID', data.user?.id === authUser.id);
    assert('Password hash not returned in profile', !data.user?.password_hash);
  }

  // 7. Seed user login
  console.log('\n── Seed User Login ──');
  {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex@lifequest.app', password: 'password123' }),
    });
    const data = await res.json();
    assert('Seed user Alex can log in with demo password (200)', res.status === 200, JSON.stringify(data));
  }

  // Summary
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Auth Results: ${passed} passed, ${failed} failed`);
  if (serverInstance) serverInstance.close();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect().catch(() => {});
  }
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All Auth API tests passed successfully!');
    process.exit(0);
  }
}

run().catch(async (err) => {
  console.error('Test error:', err);
  if (serverInstance) serverInstance.close();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect().catch(() => {});
  }
  process.exit(1);
});
