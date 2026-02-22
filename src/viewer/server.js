/**
 * Express 웹 뷰어 서버
 * localhost(127.0.0.1)에만 바인딩, 보안 미들웨어 적용
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../db/connection.js';
import { hostValidation, csrfProtection } from './middleware.js';
import { createRouter } from './routes/issues.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 웹 뷰어 서버 시작
 * @param {string} dbPath - SQLite DB 파일 경로
 * @param {number} port - 서버 포트 (기본 3000)
 * @returns {Promise<import('http').Server>}
 */
export function startViewer(dbPath, port = 3000) {
  const db = getDb(dbPath);
  const app = express();

  // 보안 미들웨어
  app.use(hostValidation);
  app.use(csrfProtection);

  // JSON 파싱
  app.use(express.json());

  // API 라우트 마운트
  const apiRouter = createRouter(db);
  app.use('/api', apiRouter);

  // 정적 파일 서빙 (Phase 3에서 빌드된 프론트엔드)
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));

  // SPA 폴백 — API 외의 모든 GET 요청에 index.html 반환
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) {
      next();
      return;
    }
    const indexPath = path.join(distPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(200).send('Web viewer frontend is not yet built. API is available at /api/*');
      }
    });
  });

  return new Promise((resolve) => {
    const server = app.listen(port, '127.0.0.1', () => {
      console.error(`[viewer] Issue tracker web viewer running at http://127.0.0.1:${port}`);
      console.error(`[viewer] API available at http://127.0.0.1:${port}/api/`);
      resolve(server);
    });

    // graceful shutdown
    const shutdown = () => {
      console.error('\n[viewer] Shutting down...');
      server.close(() => {
        db.close();
        process.exit(0);
      });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });
}
