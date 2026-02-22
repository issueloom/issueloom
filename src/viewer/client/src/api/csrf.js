let cachedToken = null;
let fetchedAt = 0;
const CLIENT_TTL = 3 * 60 * 60 * 1000; // 3시간

export async function getCsrfToken() {
  if (cachedToken && Date.now() - fetchedAt < CLIENT_TTL) {
    return cachedToken;
  }
  const res = await fetch('/api/csrf-token');
  if (!res.ok) throw new Error('Failed to fetch CSRF token');
  const data = await res.json();
  cachedToken = data.token;
  fetchedAt = Date.now();
  return cachedToken;
}

export function invalidateToken() {
  cachedToken = null;
  fetchedAt = 0;
}

/**
 * CSRF 토큰을 자동 첨부하는 래퍼.
 * 403 시 토큰 무효화 → 재발급 → 1회 재시도.
 */
export async function withCsrf(apiCall) {
  const token = await getCsrfToken();
  const result = await apiCall(token);
  if (result.status === 403) {
    invalidateToken();
    const newToken = await getCsrfToken();
    return apiCall(newToken);
  }
  return result;
}
