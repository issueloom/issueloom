/**
 * MCP 서버 진입점
 * stdio 통신, --db 경로로 SQLite 연결
 * console.log 사용 금지 (stdout은 JSON-RPC 통신용)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getDb } from '../db/connection.js';
import { registerTools } from './tools.js';

/**
 * CLI 인자에서 --db 경로 파싱
 */
function parseDbPath(args) {
  const dbIndex = args.indexOf('--db');
  if (dbIndex === -1 || dbIndex + 1 >= args.length) {
    return null;
  }
  return args[dbIndex + 1];
}

/**
 * MCP 서버 시작
 */
export async function startServer(dbPath) {
  if (!dbPath) {
    console.error('Error: --db <path> is required');
    process.exit(1);
  }

  let db;
  try {
    db = getDb(dbPath);
  } catch (e) {
    console.error(`Error: Failed to open database: ${e.message}`);
    process.exit(1);
  }

  const server = new McpServer({
    name: 'issueloom',
    version: '0.2.0',
  });

  // DB 접근 함수 — 도구 핸들러에서 사용
  const getDbInstance = () => db;

  registerTools(server, getDbInstance);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[issueloom] MCP server started');

  // 정상 종료 처리
  process.on('SIGINT', () => {
    console.error('[issueloom] Shutting down...');
    db.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.error('[issueloom] Shutting down...');
    db.close();
    process.exit(0);
  });
}

// 직접 실행 시 서버 시작 (node src/mcp/server.js --db ...)
// cli.js에서 import할 때는 실행하지 않음
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('server.js') ||
  process.argv[1].endsWith('server')
);
if (isDirectRun) {
  const dbPath = parseDbPath(process.argv);
  if (dbPath) {
    startServer(dbPath);
  }
}
