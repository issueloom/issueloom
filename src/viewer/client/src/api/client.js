import { withCsrf } from './csrf.js';

async function request(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// GET endpoints
export function fetchSummary() {
  return request('/api/summary');
}

export function fetchIssues(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const query = qs.toString();
  return request(`/api/issues${query ? `?${query}` : ''}`);
}

export function fetchIssue(issueNumber) {
  return request(`/api/issues/${encodeURIComponent(issueNumber)}`);
}

export function fetchSystems() {
  return request('/api/systems');
}

// PATCH/POST with CSRF
export function updateIssue(issueNumber, updates) {
  return withCsrf(async (token) => {
    const res = await fetch(`/api/issues/${encodeURIComponent(issueNumber)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      // 403은 withCsrf에서 재시도 처리
      if (res.status === 403) return res;
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return res.json();
  });
}

export function addRelation(issueNumber, targetIssue, relationType) {
  return withCsrf(async (token) => {
    const res = await fetch(`/api/issues/${encodeURIComponent(issueNumber)}/relations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
      body: JSON.stringify({ target_issue: targetIssue, relation_type: relationType }),
    });
    if (!res.ok) {
      if (res.status === 403) return res;
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return res.json();
  });
}

export function deleteRelation(relationId) {
  return withCsrf(async (token) => {
    const res = await fetch(`/api/relations/${relationId}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': token },
    });
    if (!res.ok) {
      if (res.status === 403) return res;
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return res.json();
  });
}

export function addComment(issueNumber, content) {
  return withCsrf(async (token) => {
    const res = await fetch(`/api/issues/${encodeURIComponent(issueNumber)}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      if (res.status === 403) return res;
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return res.json();
  });
}
