import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const CURRENT_SCHEMA_VERSION = 1;

/**
 * DB 경로 검증 — Path Traversal 방지
 * 심볼릭 링크를 통한 우회도 차단한다.
 */
export function validateDbPath(dbPath) {
  const resolved = path.resolve(dbPath);
  const projectRoot = process.cwd();

  // 정규화된 경로가 프로젝트 디렉토리 내인지 검증
  if (!resolved.startsWith(projectRoot + path.sep) && resolved !== projectRoot) {
    throw new Error(`DB path must be within the project directory: ${projectRoot}`);
  }

  // 심볼릭 링크를 통한 우회 방지 (파일이 이미 존재하는 경우)
  if (fs.existsSync(resolved)) {
    const realPath = fs.realpathSync(resolved);
    if (!realPath.startsWith(projectRoot + path.sep) && realPath !== projectRoot) {
      throw new Error(`DB path resolves outside the project directory via symlink: ${realPath}`);
    }
  }

  return resolved;
}

/**
 * 크로스 플랫폼 파일 권한 설정 (소유자 전용)
 */
function setFilePermissions(filePath) {
  try {
    if (process.platform !== 'win32') {
      fs.chmodSync(filePath, 0o600);
    }
    // Windows에서는 NTFS ACL에 의존 — Node.js의 chmod는 제한적
  } catch {
    // 권한 설정 실패는 경고만 (DB 동작에는 영향 없음)
    console.error(`[warn] Could not set file permissions on: ${filePath}`);
  }
}

/**
 * 스키마 초기화 — schema.sql 실행 및 버전 기록
 */
function initializeSchema(db) {
  const schemaSQL = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schemaSQL);

  // 스키마 버전이 없으면 초기 버전 삽입
  const version = db.prepare('SELECT MAX(version) as ver FROM schema_version').get();
  if (!version || version.ver === null) {
    db.prepare(
      'INSERT INTO schema_version (version, applied_at, description) VALUES (?, ?, ?)'
    ).run(CURRENT_SCHEMA_VERSION, new Date().toISOString(), 'Initial schema');
  }
}

/**
 * 마이그레이션 실행 — 현재 버전과 목표 버전 비교 후 순차 실행
 * Phase 1에서는 v1만 존재하므로 프레임워크만 준비
 */
function runMigrations(db) {
  const result = db.prepare('SELECT MAX(version) as ver FROM schema_version').get();
  const currentVersion = result?.ver || 0;

  if (currentVersion < CURRENT_SCHEMA_VERSION) {
    // 향후 마이그레이션 스크립트를 여기에 추가
    // 예: if (currentVersion < 2) { migrate_v1_to_v2(db); }
    console.error(`[info] Schema is up to date (v${CURRENT_SCHEMA_VERSION})`);
  }
}

/**
 * DB 연결 생성 및 초기 설정
 * @param {string} dbPath - DB 파일 경로
 * @returns {Database} better-sqlite3 인스턴스
 */
export function getDb(dbPath) {
  const resolved = validateDbPath(dbPath);

  // 부모 디렉토리가 없으면 생성
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(resolved);

  // PRAGMA 설정 (런타임 설정, 스키마와 분리)
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 스키마 초기화 및 마이그레이션
  initializeSchema(db);
  runMigrations(db);

  // 파일 권한 설정
  setFilePermissions(resolved);

  return db;
}

/**
 * init 명령 전용 — DB 생성만 수행하고 닫기
 */
export function initDb(dbPath) {
  const db = getDb(dbPath);
  db.close();
}
