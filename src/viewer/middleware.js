/**
 * 보안 미들웨어 — Host 헤더 검증 + CSRF 토큰
 */

import crypto from 'crypto';

// CSRF 토큰 저장소 (메모리, 로컬 전용이므로 세션 불필요)
const csrfTokens = new Map();
const CSRF_TOKEN_TTL_MS = 4 * 60 * 60 * 1000; // 4시간

// 허용되는 Host 값
const ALLOWED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '[::1]',
]);

/**
 * Host 값에서 포트를 제거하고 호스트명만 추출
 */
function extractHostname(hostHeader) {
  if (!hostHeader) return null;
  // IPv6 [::1]:3000 처리
  if (hostHeader.startsWith('[')) {
    const bracketEnd = hostHeader.indexOf(']');
    if (bracketEnd !== -1) {
      return hostHeader.slice(0, bracketEnd + 1);
    }
  }
  // hostname:port에서 hostname 추출
  const colonIdx = hostHeader.lastIndexOf(':');
  if (colonIdx > 0) {
    return hostHeader.slice(0, colonIdx);
  }
  return hostHeader;
}

/**
 * Host 헤더 검증 미들웨어 (DNS Rebinding 방지)
 */
export function hostValidation(req, res, next) {
  const host = req.headers.host;
  const hostname = extractHostname(host);

  if (!hostname || !ALLOWED_HOSTS.has(hostname)) {
    res.status(403).json({ error: 'Forbidden: invalid Host header' });
    return;
  }
  next();
}

/**
 * 만료된 CSRF 토큰 정리
 */
function cleanExpiredTokens() {
  const now = Date.now();
  for (const [token, expiresAt] of csrfTokens) {
    if (now > expiresAt) {
      csrfTokens.delete(token);
    }
  }
}

/**
 * CSRF 토큰 발급
 */
export function issueCsrfToken() {
  cleanExpiredTokens();
  const token = crypto.randomUUID();
  csrfTokens.set(token, Date.now() + CSRF_TOKEN_TTL_MS);
  return token;
}

/**
 * CSRF 토큰 검증 미들웨어
 * 상태 변경 메서드(POST, PATCH, PUT, DELETE)에만 적용
 */
export function csrfProtection(req, res, next) {
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    next();
    return;
  }

  const token = req.headers['x-csrf-token'];
  if (!token || !csrfTokens.has(token)) {
    res.status(403).json({ error: 'Forbidden: invalid or missing CSRF token' });
    return;
  }

  // 토큰은 일회용이 아닌 TTL 기반 (같은 세션에서 반복 사용 가능)
  next();
}
