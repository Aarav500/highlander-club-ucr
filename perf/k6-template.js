/**
 * k6 Load Test Template
 *
 * A starter script for baseline performance testing of API endpoints.
 * Copy this file to <app_slug>-perf.js and customize for your app.
 *
 * Usage:
 *   k6 run perf/k6-template.js
 *   k6 run --vus 50 --duration 60s perf/k6-template.js
 *   k6 run -e BASE_URL=http://staging.example.com perf/k6-template.js
 */

import http from "k6/http";
import { check, sleep } from "k6";

// ─── Configuration ──────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";

export const options = {
  // Default: 10 virtual users for 30 seconds
  vus: 10,
  duration: "30s",

  // Thresholds – the test fails if these are breached
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95th percentile under 500ms
    http_req_failed: ["rate<0.01"],   // less than 1% errors
  },
};

// ─── Test Scenarios ─────────────────────────────────────────────────

export default function () {
  // 1. Health check — should always be fast
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    "GET /health returns 200": (r) => r.status === 200,
    "GET /health < 200ms": (r) => r.timings.duration < 200,
  });

  // 2. GET endpoint — read operation
  const listRes = http.get(`${BASE_URL}/api/examples`);
  check(listRes, {
    "GET /api/examples returns 200": (r) => r.status === 200,
    "GET /api/examples < 500ms": (r) => r.timings.duration < 500,
  });

  // 3. POST endpoint — write operation
  const payload = JSON.stringify({
    name: `perf-test-${Date.now()}`,
    description: "Created by k6 load test",
  });
  const params = {
    headers: { "Content-Type": "application/json" },
  };
  const createRes = http.post(`${BASE_URL}/api/examples`, payload, params);
  check(createRes, {
    "POST /api/examples returns 2xx": (r) => r.status >= 200 && r.status < 300,
    "POST /api/examples < 500ms": (r) => r.timings.duration < 500,
  });

  // ─── Add your app-specific endpoints below ──────────────────────
  //
  // Example: authenticated endpoint
  //
  // const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
  //   email: "test@example.com",
  //   password: "test-password",
  // }), params);
  // const token = JSON.parse(loginRes.body).token;
  //
  // const protectedRes = http.get(`${BASE_URL}/api/profile`, {
  //   headers: { Authorization: `Bearer ${token}` },
  // });
  // check(protectedRes, {
  //   "GET /api/profile returns 200": (r) => r.status === 200,
  // });
  //
  // ─────────────────────────────────────────────────────────────────

  // Pause between iterations to simulate realistic user think-time
  sleep(1);
}
