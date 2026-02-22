#!/usr/bin/env node

/**
 * CLI 진입점
 * 명령어: init (DB 초기화), viewer (Phase 2), 기본 (MCP 서버)
 */

import { initDb } from '../src/db/connection.js';
import { startServer } from '../src/mcp/server.js';
import { startViewer } from '../src/viewer/server.js';

const args = process.argv.slice(2);
const command = args[0];

function parseFlag(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

function printUsage() {
  console.error(`
issueloom - Agent Issue Tracker for AI agent teams

Usage:
  issueloom --db <path>              Start MCP server
  issueloom init --db <path>         Initialize database
  issueloom viewer --db <path>       Start web viewer

Options:
  --db <path>    Path to SQLite database file (required)
  --port <port>  Port for web viewer (default: 3000)
`);
}

async function main() {
  const dbPath = parseFlag('--db');

  if (command === 'init') {
    if (!dbPath) {
      console.error('Error: --db <path> is required');
      process.exit(1);
    }
    try {
      initDb(dbPath);
      console.error(`Issue tracker database initialized at: ${dbPath}`);
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  } else if (command === 'viewer') {
    if (!dbPath) {
      console.error('Error: --db <path> is required');
      process.exit(1);
    }
    const port = parseInt(parseFlag('--port') || '3000', 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      console.error('Error: --port must be a valid port number (1-65535)');
      process.exit(1);
    }
    await startViewer(dbPath, port);
  } else if (command === '--help' || command === '-h') {
    printUsage();
  } else {
    // 기본: MCP 서버 시작
    // server.js가 process.argv에서 --db를 직접 파싱하므로
    // 여기서는 startServer를 명시적으로 호출
    if (!dbPath) {
      console.error('Error: --db <path> is required');
      printUsage();
      process.exit(1);
    }
    await startServer(dbPath);
  }
}

main().catch((e) => {
  console.error(`Fatal: ${e.message}`);
  process.exit(1);
});
